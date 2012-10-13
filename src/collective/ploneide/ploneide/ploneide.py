# Echo server program

import SimpleHTTPServer
import SocketServer

import sys
import os
import logging
import cgi
import re
import json
import urllib
import urllib2
import subprocess

import signal

from rope.contrib.codeassist import get_definition_location

from static_check import StaticCheck

from thread import start_new_thread

from zcml_frontend.main import ZCMLDirectives
from zcml_frontend.main import ZCMLNamespaces

#from threading import Thread

#from config import HOST
#from config import PORT

FORMAT = '%(asctime)-15s %(message)s'
logging.basicConfig(format=FORMAT)

logger = logging.getLogger("collective.ploneide: ")


class PloneIDEServer(SocketServer.TCPServer):
    """
    Base server
    """

    def __init__(self, config, http_handler, rope_project, rope_handler):
        self.config = config
        server_address = (config.ploneide_host, config.ploneide_port)
        SocketServer.TCPServer.__init__(self, server_address, http_handler)
        self.stdout = []
        self.stderr = []
        self.stdout_html = ''
        self.stderr_html = ''
        self.read_stdout_thread = None
        self.read_stderr_thread = None
        self.rope_project = rope_project
        self.rope_handler = rope_handler

    def open_file(self, directory, file_name):
        result = None
        if directory and file_name:
            to_open = os.path.join(directory, file_name)
            text = file(to_open, 'r')
            result = text.read()
            text.close()

        return result

    def save_file(self, directory, file_name, content):
        result = None
        if directory and file_name:
            to_open = os.path.join(directory, file_name)
            result = to_open
            text = file(to_open, 'w')
            text.write(content)
            text.close()

        return result

    def directory_content_ajax(self, directory='', initial=False):

        if initial:
            # TODO: At the moment, we are just going to support "src" folder
            #       but eventually, we will provide a wider range of
            #       directories

            directory = self.config.devel_dirs['src']

        if directory:
            # Files to exclude
            files_to_exclude = re.compile(r".*(pyc)$|.*~$")
            dirs_to_exclude = re.compile(r"\A(\.)")

            # We will need to chdir to the directory, and then go back before
            # leaving
            cwd = os.getcwd()
            os.chdir(directory)
            dir_contents = os.listdir('.')

            files = [i for i in dir_contents if (not os.path.isdir(i) and
                     not files_to_exclude.match(i))]

            dirs = [i for i in dir_contents if (os.path.isdir(i) and
                                                not dirs_to_exclude.match(i))]

            files.sort()
            dirs.sort()
            raw_json_dirs = [{'title':x,
                              'metatype':'folder',
                              'folderish':'true',
                              'rel': directory + '/' + x} for x in dirs]

            raw_json_files = [{'title':x,
                               'metatype':'page',
                               'rel': directory + '/' + x} for x in files]

            os.chdir(cwd)
            return json.dumps(raw_json_dirs + raw_json_files)

        return

    def get_servers_info(self):
        data = {'instance_host': self.config.instance_host,
                'instance_port': self.config.instance_port,
                'ploneide_host': self.config.ploneide_host,
                'ploneide_port': self.config.ploneide_port,
                'debug_host': self.config.debug_host,
                'debug_port': self.config.debug_port}

        return json.dumps(data)

    def get_developer_manual_location(self):
        return self.config.dev_manual_loc

    def _ping_server(self, url):
        up = False
        try:
            # print "try"
            urllib2.urlopen(url, timeout=0.2)
            up = True
        except urllib2.URLError:
            # print "except1"
            up = False
        except:
            # print "except2"
            up = False

        return up

    def check_debug_running(self):
        url = "http://%s:%s" % (self.config.debug_host,
                                self.config.debug_port)

        return self._ping_server(url)

    def check_plone_instance_running(self):
        url = "http://%s:%s" % (self.config.instance_host,
                                self.config.instance_port)

        return self._ping_server(url)

    def start_plone_instance(self,
                             sauna=False,
                             debugger=False,
                             bkpts=[],
                             lines_console=300):
        #import pdb;pdb.set_trace()
        #XXX: There *MUST* be a better way than this...
        #XXX: Use a Mutex or something so we can't start several times
        env = os.environ
        env['PYTHONPATH'] = ':'.join(sys.path)
        self.zope_pid = subprocess.Popen(["python",
                                          "start_plone.py",
                                          str(self.config.debug_host),
                                          str(self.config.debug_port),
                                          str(sauna),
                                          str(debugger),
                                          str(self.config.config_file),
                                          json.dumps(bkpts)],
                                          env=env,
                                          stdout=subprocess.PIPE,
                                          stderr=subprocess.PIPE)
        # self.zope_pid = subprocess.Popen(["python",
        #                                   "start_plone.py",
        #                                   str(self.config.debug_host),
        #                                   str(self.config.debug_port),
        #                                   str(sauna),
        #                                   str(debugger),
        #                                   str(self.config.config_file),
        #                                   json.dumps(bkpts)],
        #                                   env=env)
        self.lines_console = lines_console
        self.stdout = []
        self.stderr = []
        self.stdout_html = ''
        self.stderr_html = ''
        self.read_stdout_thread = start_new_thread(self.readstdout, ())
        self.read_stderr_thread = start_new_thread(self.readstderr, ())

    def readstdout(self):
        text = self.zope_pid.stdout.readline()
        while text:
            self.stdout.append(text)
            self.stdout = self.stdout[-self.lines_console:]
            self.pipe_to_html('stdout')
            text = self.zope_pid.stdout.readline()

    def readstderr(self):
        text = self.zope_pid.stderr.readline()
        while text:
            self.stderr.append(text)
            self.stderr = self.stderr[-self.lines_console:]
            self.pipe_to_html('stderr')
            text = self.zope_pid.stderr.readline()

    def pipe_to_html(self, name):

        html = '<div class="%s-output"><h1>%s</h1>' % (name, name.upper())
        pipe = getattr(self, name)

        opened_list = False
        for line in pipe:
            if line.startswith('\t') and opened_list:
                html += '<li>%s</li>' % line.strip()
            elif line.startswith('\t') and not opened_list:
                html += '<ul><li>%s</li>' % line.strip()
                opened_list = True
            elif not line.startswith('\t') and opened_list:
                html += '</ul><p>%s</p>' % line.strip()
                opened_list = False
            else:
                html += '<p>%s</p>' % line.strip()
        html += '</div>'

        setattr(self, name + '_html', html)

    def kill_plone_instance(self):
        if self.zope_pid:
            self.zope_pid.send_signal(signal.SIGINT)

    def get_console_output(self, lines_console=300):
        output = """
        <div id="console-output">
        %s
        %s
        </div>
        """ % (self.stdout_html, self.stderr_html)

        return output

    def dispatch_debugger_command(self, params):
        result = "" 
        # print "CHECK DEBUGGING"
        if self.check_debug_running():
            # print "PARAMS", params
            url = "http://%s:%s" % (self.config.debug_host,
                                    self.config.debug_port)
            result = urllib2.urlopen(url, params)

        return result

    def start_debugging(self):
        result = ""
        if self.check_plone_instance_running():
            url = "http://%s:%s/@@start-debugging" % (self.config.instance_host,
                                                      self.config.instance_port)
            result = urllib2.urlopen(url)

        return result
        
    def stop_debugging(self):
        result = ""
        if self.check_plone_instance_running():
            url = "http://%s:%s/@@stop-debugging" % (self.config.instance_host,
                                                     self.config.instance_port)
            result = urllib2.urlopen(url)

        return result
        
    def add_breakpoint(self, filename, line, condition=None, temporary = 0):
        result = ""
        params = {'filename': filename,
                  'line': line,
                  'condition': condition,
                  'temporary': temporary,}

        # First, check with the instance, if it is responding, then add the breakpoint
        if self.check_plone_instance_running():
            url = "http://%s:%s/@@add-breakpoint" % (self.config.instance_host,
                                                     self.config.instance_port)
            result = urllib2.urlopen(url, urllib.urlencode(params))

        # If it's not, then probably we are in a debug session, so send the breakpoint there
        params['command'] = 'add-breakpoint'
        if self.check_debug_running():
            url = "http://%s:%s" % (self.config.debug_host,
                                    self.config.debug_port)
            result = urllib2.urlopen(url, urllib.urlencode(params))

        return result

    def remove_breakpoint(self, filename, line):
        result = ""
        params = {'filename': filename,
                  'line': line,}

        # First, check with the instance, if it is responding, then add the breakpoint
        if self.check_plone_instance_running():
            url = "http://%s:%s/@@remove-breakpoint" % (self.config.instance_host,
                                                     self.config.instance_port)
            result = urllib2.urlopen(url, urllib.urlencode(params))

        # If it's not, then probably we are in a debug session, so send the breakpoint there
        params['command'] = 'remove-breakpoint'
        if self.check_debug_running():
            url = "http://%s:%s" % (self.config.debug_host,
                                    self.config.debug_port)
            result = urllib2.urlopen(url, urllib.urlencode(params))

        return result

    def get_breakpoints(self, filename):
        pass

    def static_check(self, content=""):

        check = StaticCheck(content)

        check.check_pep8()
        check.check_pyflakes()

        results = check.get_results()

        return json.dumps(results)

    def run(self):
        #logger.info("Starting internal server in %s:%s" % (
                                                 #self.config.ploneide_host,
                                                 #self.config.ploneide_port))

        print "Starting internal server in %s:%s" % (self.config.ploneide_host,
                                                     self.config.ploneide_port)
        self.serve_forever(poll_interval=0.5)

    def stop(self):
        self.shutdown()

    def get_code_definition(self, code, line, column):
        # Calculate the offset
        index = 0
        for i in range(int(line)):
            try:
                index = code.index('\n', index+1)
            except:
                return ""

        offset = index + int(column) + 1

        try:
            definition = get_definition_location(self.rope_project, code, offset)
        except:
            # Something bad happened
            return ""

        if definition:
            fileobject = definition[0]
            lineno = definition[1]

            if fileobject and lineno:
                filepath = fileobject.path        
                return "%s:%s" % (filepath, lineno)
            else:
                return ""
        else:
            return ""

    def get_zcml_directives(self):
        old_cwd = os.getcwd()
        os.chdir('zcml_frontend')
        directives = ZCMLDirectives()
        os.chdir(old_cwd)
        return directives.toString()

    def get_zcml_namespaces(self):
        old_cwd = os.getcwd()
        os.chdir('zcml_frontend')
        namespaces = ZCMLNamespaces()
        os.chdir(old_cwd)
        return namespaces.toString()        


class PloneIDEHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    """
    Handler class from where we handle requests.
    This is a paralel HTTP server that will handle some functionality we
    require, in case:
    a) Zope is down
    b) We are in a debug session and Zope main process is stopped.

    """

    def __init__(self, *args):

        #XXX: Is this the best way on doing this ?
        self.ploneide_server = args[2]

        self.debugger_commands = ['is-stopped',
                                  'get-debugger-scope',
                                  'add-watched-variable',
                                  'eval-code',]

        self.debugger_dispatch = self.ploneide_server.dispatch_debugger_command

        self.commands_map = {
            'get-servers-info': self.ploneide_server.get_servers_info,
            'get-developer-manual-location': self.ploneide_server.get_developer_manual_location,
            'check-plone-instance-running': self.ploneide_server.check_plone_instance_running,
            'check-debug-running': self.ploneide_server.check_debug_running,
            'start-plone-instance': self.ploneide_server.start_plone_instance,
            'kill-plone-instance': self.ploneide_server.kill_plone_instance,
            'get-console-output': self.ploneide_server.get_console_output,
            'get-directory-content-ajax': self.ploneide_server.directory_content_ajax,
            'open-file': self.ploneide_server.open_file,
            'save-file': self.ploneide_server.save_file,
            'python-static-check': self.ploneide_server.static_check,
            'start-debugging': self.ploneide_server.start_debugging,
            'stop-debugging': self.ploneide_server.stop_debugging,
            'add-breakpoint': self.ploneide_server.add_breakpoint,
            'remove-breakpoint': self.ploneide_server.remove_breakpoint,
            'get-breakpoints': self.ploneide_server.get_breakpoints,
            'get-code-definition': self.ploneide_server.get_code_definition,
            'get-zcml-directives': self.ploneide_server.get_zcml_directives,
            'get-zcml-namespaces': self.ploneide_server.get_zcml_namespaces,
                                  
        }
        try:
            SimpleHTTPServer.SimpleHTTPRequestHandler.__init__(self, *args)
        except:
            pass

    def decode_params(self):
        """
        This method will replace special encoded characters in URLs
        Need to find if there's already somehting in python that do it
        """

        #XXX: Check all possible characters we might need to decode
        char_map = {
            "%2B": "+",
            "%2F": "/",
            "%3D": "=",
        }

        for par in self.params.keys():
            for code in char_map:
                self.params[par] = self.params[par].replace(code,
                                                            char_map[code])

    def dispatch_command(self):
        """
        From here we will call the proper function.
        """

        #XXX: Do some checks before

        # Here we check which was the command issued
        command = self.params['command']

        if command not in self.debugger_commands:
            # Then we remove it from the list of params
            del(self.params['command'])
            # And we call the proper function
            # print "COMMAND:", command
            # print "self.params", self.params
            self.result = self.commands_map[command](**self.params)
        else:
            # This is a command intended for the debugger
            params = urllib.urlencode(self.params)
            self.result = self.debugger_dispatch(params)
            if self.result:
                self.result = self.result.read()
            # print "RETURNED FROM DEBUGGER: ", self.result

    def do_GET(self):
        """
        GET handler
        """

        # XXX: Need to do stronger checks, and proper data return in case
        # of possible errors
        #import pdb;pdb.set_trace()

        self.params = {}
        self.result = False

        old_cwd = os.getcwd()

        if self.path.startswith('/developermanual'):
            path = self.ploneide_server.get_developer_manual_location()
            os.chdir(path)
            self.path = self.path[len('/developermanual'):]

        if '?' in self.path:
            params = '?'.join(self.path.split('?')[1:])
            param_list = params.split('&')
            self.params = dict([i.split('=') for i in param_list])

            self.decode_params()

            if 'command' in self.params:
                self.dispatch_command()

                self.send_response(200)
                self.send_header("Content-type", "text/plain; charset=utf-8")

                # Headers needed for Cross-Origin Resource Sharing
                # http://www.quimeraazul.com/tutoriales/2011/02/ajax-entre-dominios-con-el-estandar-cors-cross-origin-resource-sharing/

                # XXX: This should check all valid hosts from origin
                #import pdb;pdb.set_trace()
                self.send_header("Access-Control-Allow-Origin",
                                 "http://localhost:%s" %
                                 self.ploneide_server.config.ploneide_port)

                self.send_header("Access-Control-Allow-Methods",
                                 "POST, GET, OPTIONS")

                self.end_headers()
                self.wfile.write(self.result)
            else:
                SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

        else:
            SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

        # Let's go back to our old dir
        os.chdir(old_cwd)
        #return self.result

    def do_POST(self):
        """
        POST handler

        POST handling was taken from
        http://blog.doughellmann.com/2007/12/pymotw-basehttpserver.html
        """

        # XXX: Need to do stronger checks, and proper data return in case
        # of possible errors
        self.params = {}
        self.result = False

        #import pdb;pdb.set_trace()
        content = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST',
                             'CONTENT_TYPE': self.headers['Content-Type'],
                             }
        )
        for key in content.keys():
            if isinstance(content[key], list):
                # For some reason, when we get a list, the key name, ends
                # with '[]' in it's name (??) that's why we need to do
                # key[:-2] in the params key
                self.params[key[:-2]] = [i.value for i in content[key]]
            else:
                self.params[key] = content[key].value
            
        self.dispatch_command()

        # Begin the response
        self.send_response(200)

        # XXX: This should check all valid hosts from origin
        #import pdb;pdb.set_trace()
        self.send_header("Access-Control-Allow-Origin",
                         "http://localhost:%s" %
                         self.ploneide_server.config.ploneide_port)

        self.send_header("Access-Control-Allow-Methods",
                         "POST, GET, OPTIONS")

        self.end_headers()
        self.wfile.write(self.result)

        return