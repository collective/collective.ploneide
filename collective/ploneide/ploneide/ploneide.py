# Echo server program

import SimpleHTTPServer
import SocketServer

import os
import BaseHTTPServer
import logging
import cgi

#from threading import Thread

from config import HOST
from config import PORT

FORMAT = '%(asctime)-15s %(message)s'
logging.basicConfig(format=FORMAT)

logger = logging.getLogger("collective.ploneide: ")

class PloneIDEServer(SocketServer.TCPServer):
    """
    Base server
    """

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

    def add_breakpoint(self):
        pass

    def remove_breakpoint(self):
        pass

    def get_breakpoints(self):
        pass

    def start_debugging(self):
        pass

    def stop_debugging(self):
        pass

    def is_stopped(self):
        pass

    def get_scope(self):
        pass

    def add_watched_variable(self):
        pass

    def eval_code(self):
        pass

    def run(self):
        logger.info("Starting internal server in %s:%s" % (HOST, PORT))
        self.serve_forever(poll_interval=0.5)
        
    def stop(self):
        self.shutdown()

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
        
        self.commands_map = {
                            'open-file' : self.ploneide_server.open_file,
                            'save-file' : self.ploneide_server.save_file,
                            'add-breakpoint' : self.ploneide_server.add_breakpoint,
                            'remove-breakpoint' : self.ploneide_server.remove_breakpoint,
                            'get-breakpoints' : self.ploneide_server.get_breakpoints,
                            'start-debugging' : self.ploneide_server.start_debugging,
                            'stop-debugging' : self.ploneide_server.stop_debugging,
                            'is-stopped': self.ploneide_server.is_stopped,
                            'get-debugger-scope': self.ploneide_server.get_scope,
                            'add-watched-variable': self.ploneide_server.add_watched_variable,
                            'eval-code': self.ploneide_server.eval_code,
                            }

        SimpleHTTPServer.SimpleHTTPRequestHandler.__init__(self, *args)


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
        self.result = self.commands_map[command](**self.params)

    def do_GET(self):
        """
        GET handler
        """
        
        # XXX: Need to do stronger checks, and proper data return in case
        # of possible errors
        #import pdb;pdb.set_trace()
        
        self.params = {}
        self.result = False

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

                servers = getattr(config.getConfiguration(), 'servers', None)
                if servers:
                    instance_port = servers[0].port

                    self.send_header("Access-Control-Allow-Origin",
                                    "http://localhost:%s" % instance_port)
                    self.send_header("Access-Control-Allow-Methods",
                                    "POST, GET, OPTIONS")

                self.end_headers()
                self.wfile.write(self.result)
            else:
                self.result = SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

        else:
            self.result = SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)
            
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

if __name__ == "__main__":

    #logger.setLevel('INFO')
    server_address = (HOST, PORT)
    httpd = PloneIDEServer(server_address, PloneIDEHandler)

    try:
        httpd.run()
    except KeyboardInterrupt:
        httpd.stop()
    