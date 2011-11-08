# Echo server program

import BaseHTTPServer
import logging
import cgi

from threading import Thread

from App import config

logger = logging.getLogger("collective.ploneide: ")

from collective.ploneide.config import AUX_HOST
from collective.ploneide.config import AUX_PORT
from collective.ploneide.config import DEBUGGER_HOST
from collective.ploneide.config import DEBUGGER_PORT

from collective.ploneide.browser.file_operations import open_file
from collective.ploneide.browser.file_operations import save_file
from collective.ploneide.debug import debugger


COMMANDS_MAP = {
    'open-file' : open_file,
    'save-file' : save_file,
    'add-breakpoint' : debugger.addBreakpoint,
    'remove-breakpoint' : debugger.removeBreakpoint,
    'get-breakpoints' : debugger.getBreakpoints,
    'start-debugging' : debugger.start_debugging,
    'stop-debugging' : debugger.stop_debugging,
    'is-stopped': debugger.is_stopped,
    'get-debugger-scope': debugger.get_scope,
    'add-watched-variable':debugger.add_watched_variable,
    'eval-code': debugger.eval_code,
    }

class PloneIDEServer(BaseHTTPServer.HTTPServer, Thread):
    """
    Base server
    """

    def __init__(self, addr, handler):
        BaseHTTPServer.HTTPServer.__init__(self, addr, handler)
        Thread.__init__(self)

    def run(self):
        print "Starting internal server in %s:%s" % (AUX_HOST, AUX_PORT)
        self.serve_forever()

    def stop(self):
        pass

class PloneIDEHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    """
    Handler class from where we handle requests.
    This is a paralel HTTP server that will handle some functionality we
    require, in case:
    a) Zope is down
    b) We are in a debug session and Zope main process is stopped.

    """

    def decode_params(self):
        """
        This method will replace special encoded characters in URLs
        Need to find if there's already somehting in python that do it
        """

        #XXX: Check all possible characters we might need to decode
        char_map = {
            "%2B" : "+",
            "%2F" : "/",
            "%3D" : "=",
            }

        for par in self.params.keys():
            for code in char_map:
                self.params[par] = self.params[par].replace(code, char_map[code])

    def dispatch_command(self):
        """
        From here we will call the proper function.
        """

        #XXX: Do some checks before

        # Here we check which was the command issued
        command = self.params['command']
        # Then we remove it from the list of params
        del(self.params['command'])
        # And we call the proper function
        self.result = COMMANDS_MAP[command](**self.params)

    def do_GET(self):
        """
        GET handler
        """

        # XXX: Need to do stronger checks, and proper data return in case
        # of possible errors
        self.params = {}
        self.result = False

        if self.path and len(self.path)>2:

            if self.path.startswith('/'):
                params = self.path[2:]
            else:
                params = self.path[1:]

            param_list = params.split('&')
            self.params = dict([i.split('=') for i in param_list])

            self.decode_params()

            self.dispatch_command()

            self.send_response(200)
            self.send_header("Content-type", "text/plain; charset=utf-8")

            # Headers needed for Cross-Origin Resource Sharing
            # http://www.quimeraazul.com/tutoriales/2011/02/ajax-entre-dominios-con-el-estandar-cors-cross-origin-resource-sharing/

            servers = getattr(config.getConfiguration(), 'servers', None)
            if servers:
                instance_port = servers[0].port

                self.send_header("Access-Control-Allow-Origin", "http://localhost:%s" % instance_port)
                self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

            self.end_headers()
            self.wfile.write(self.result)

        return self.result

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

        content = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD':'POST',
                                'CONTENT_TYPE':self.headers['Content-Type'],
                                })

        for key in content.keys():
            self.params[key] = content[key].value

        self.dispatch_command()

        # Begin the response
        self.send_response(200)

        servers = getattr(config.getConfiguration(), 'servers', None)
        if servers:
            instance_port = servers[0].port

            self.send_header("Access-Control-Allow-Origin", "http://localhost:%s" % instance_port)
            self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

        self.end_headers()
        self.wfile.write(self.result)

        return

server_address = (AUX_HOST, AUX_PORT)
httpd = PloneIDEServer(server_address, PloneIDEHandler)

