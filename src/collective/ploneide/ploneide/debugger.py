import bdb
import sys
import threading
import types
import BaseHTTPServer
import cgi
import os
import linecache
import json

from time import sleep
from copy import deepcopy

from App import config


class Debugger(bdb.Bdb, BaseHTTPServer.BaseHTTPRequestHandler):
    """
    Main debugger for PloneIDE.
    Most of this was taken from PDB
    """

    def __call__(self, request, client_address, server):
        BaseHTTPServer.BaseHTTPRequestHandler.__init__(self, request, client_address, server)

    def __init__(self, debugger_host, debugger_port):
        bdb.Bdb.__init__(self)
        server_address = (debugger_host, debugger_port)
        self.http = BaseHTTPServer.HTTPServer(server_address, self)
        # We use this variable to know if the debugger has stopped execution
        self.stopped = False
        # We use this value to know if we should restart execution in case
        # of an exception in the execution.
        self.should_run = True

        # Auxiliar dictionary where we will store stuff
        self.ploneide = {}

    def add_watched_variable(self, variable):
        watched_variables = self.ploneide.get("watched-variables", [])

        if variable not in watched_variables:
            watched_variables.append(variable)

        self.ploneide["watched-variables"] = watched_variables


    def get_scope(self, scope):
        """
        This method will return the scope for where the debugger
        is stopped.
        """
        if (self.stopped and self.curframe) or scope == "watched":
            # First, we get the current scope and the values it had before
            if scope == "global":
                aux_dict = self.curframe.f_globals
                old_values = self.ploneide.get('old_global_scope', {})
            elif scope == "local":
                aux_dict = self.curframe.f_locals
                old_values = self.ploneide.get('old_local_scope', {})
            elif scope == "watched":
                watched_variables = self.ploneide.get("watched-variables", [])

                if self.stopped:
                    aux_dict = dict([(var, self.get_eval(var)) for var in watched_variables])
                else:
                    aux_dict = dict([(var, "") for var in watched_variables])

                old_values = self.ploneide.get('old_watched_scope', {})
            else:
                return False

            scope_dict = {}
            for key in aux_dict.keys():
                # We need to convert the dict keys and values to strings
                str_key = key if isinstance(key, basestring) else repr(key)
                value = aux_dict[key] if isinstance(aux_dict[key], basestring) else repr(aux_dict[key])

                scope_dict[str_key] = value

            result = {}

            for key in scope_dict.keys():
                # We will iterate over each one to know if the value changed
                old_value = old_values.get(key)
                new_value = scope_dict.get(key)

                if old_values.has_key(key):
                    # Value has changed?
                    changed = old_value != new_value
                else:
                    changed = True

                # We get our values and keys as strings, so we can return a JSON

                result[key] = {'value':new_value,
                               'changed':repr(changed)}

            # Save the scope for later
            if scope == "global":
                self.ploneide['old_global_scope'] = deepcopy(scope_dict)
            elif scope == "local":
                self.ploneide['old_local_scope'] = deepcopy(scope_dict)
            elif scope == "watched":
                self.ploneide['old_watched_scope'] = deepcopy(scope_dict)

            return json.dumps(result)
        else:
            return False

    def is_stopped(self):
        """
        This method will return the filename and line number where the
        debugger is stopped at.
        False otherwise
        """
        if self.stopped:
            return "%s:%s" %(self.canonic(self.curframe.f_code.co_filename),
                            self.curframe.f_lineno)

        else:
            return False

    def set_dispatcher(self):
        self.can_debug = False
        frame = sys._getframe().f_back
        self.reset()
        while frame:
            frame.f_trace = self.trace_dispatch
            self.botframe = frame
            frame = frame.f_back
        self.set_continue()
        sys.settrace(self.trace_dispatch)
        #threading.settrace(self.trace_dispatch)

    def remove_dispatcher(self):
        self.can_debug = False
        sys.settrace(None)
        #threading.settrace(None)

    def start_debugging(self):
        self.can_debug = True

    def stop_debugging(self):
        self.can_debug = False

    def displayhook(self, obj):
        """Custom displayhook for the exec in default(), which prevents
        assignment of the _ variable in the builtins.
        Taken from the pdb module
        """
        # Save the values to get returned so the boxes in the browser can print
        # them
        if obj is not None:
            self.ploneide['obj'] = repr(obj)

    def default(self, line):
        if line[0] == '!':
            line = line[1:]
        locals = self.curframe.f_locals
        globals = self.curframe.f_globals
        try:
            code = compile(line + '\n', '<stdin>', 'single')
            save_displayhook = sys.displayhook
            try:
                sys.displayhook = self.displayhook
                exec code in globals, locals
                to_return = self.ploneide.get('obj')
                if to_return:
                    return to_return
            finally:
                sys.displayhook = save_displayhook
        except:
            t, v = sys.exc_info()[:2]
            if type(t) == type(''):
                exc_type_name = t
            else:
                exc_type_name = t.__name__
            return "*** %s: %s" % (exc_type_name, v)

    def eval_code(self, input):
        """
        This will run arbitrary code within the context of the current frame
        """
        line = input
        if self.stopped and self.curframe:
            if line.startswith("print "): # The space at the end is intentional
                call_default = False
                line = line[6:]
            else:
                call_default = True

            if call_default:
                return self.default(line)
            else:
                return self.get_eval(line)

        else:
            return "*** Debugger is not stopped at any line ***"

    def get_eval(self, line):

        try:
            return eval(line,
                        self.curframe.f_globals,
                        self.curframe.f_locals)
        except:
            t, v = sys.exc_info()[:2]
            if isinstance(t, str):
                exc_type_name = t
            else:
                exc_type_name = t.__name__
            return "*** %s: %s" % (exc_type_name, repr(v))


    def lookupmodule(self, filename):
        """Helper function for break/clear parsing -- may be overridden.

        lookupmodule() translates (possibly incomplete) file or module name
        into an absolute file name.
        """
        if os.path.isabs(filename) and  os.path.exists(filename):
            return filename
        f = os.path.join(sys.path[0], filename)
        if  os.path.exists(f) and self.canonic(f) == self.mainpyfile:
            return f
        root, ext = os.path.splitext(filename)
        if ext == '':
            filename = filename + '.py'
        if os.path.isabs(filename):
            return filename
        for dirname in sys.path:
            while os.path.islink(dirname):
                dirname = os.readlink(dirname)
            fullname = os.path.join(dirname, filename)
            if os.path.exists(fullname):
                return fullname
        return None

    def checkline(self, filename, lineno):
        """Check whether specified line seems to be executable.

        Return `lineno` if it is, 0 if not (e.g. a docstring, comment, blank
        line or EOF). Warning: testing is not comprehensive.
        """
        # this method should be callable before starting debugging, so default
        # to "no globals" if there is no current frame
        if hasattr(self, 'curframe') and self.curframe:
            globs = self.curframe.f_globals
        else:
            globs = None
        line = linecache.getline(filename, lineno, globs)
        if not line:
            return 0
        line = line.strip()
        # Don't allow setting breakpoint at a blank line
        if (not line or (line[0] == '#') or
             (line[:3] == '"""') or line[:3] == "'''"):
            return 0
        return lineno


    def run(self, cmd, globals=None, locals=None):
        if globals is None:
            import __main__
            globals = __main__.__dict__
        if locals is None:
            locals = globals
        self.reset()

        # It's useless to start the trace at this point, since we need Zope
        # Up to open our debugger.
        #sys.settrace(self.trace_dispatch)
        if not isinstance(cmd, types.CodeType):
            cmd = cmd+'\n'
        try:
            exec cmd in globals, locals
        except bdb.BdbQuit:
            pass
        finally:
            self.quitting = 1
            self.remove_dispatcher()


    def reset(self):
        bdb.Bdb.reset(self)
        self.forget()

    def forget(self):
        self.lineno = None
        self.stack = []
        self.curindex = 0
        self.curframe = None

    def _debugger_setup(self, f, t):
        self.forget()
        self.stack, self.curindex = self.get_stack(f, t)
        self.curframe = self.stack[self.curindex][0]

    def setup(self, f=None, t=None):
        """
        Since both bdb.Bdb and BaseHTTPServer.BaseHTTPRequestHandler
        implement methods "setup", i need this in order to know which one
        to use
        """
        if f or t:
            self._debugger_setup(f, t)
        else:
            BaseHTTPServer.BaseHTTPRequestHandler.setup(self)
            self.rfile.flush()
            self.wfile.flush()

    def user_call(self, frame, argument_list):
        """
        Method that get's called when dispatching a call
        """
        if self.can_debug and self.stop_here(frame):
            #print "Call:", self.canonic(frame.f_code.co_filename), frame.f_lineno
            self.interaction(frame, None)

    def user_line(self, frame):
        """
        This function is called when we stop or break at this line.
        """
        if self.can_debug:
            #print "Line:", self.canonic(frame.f_code.co_filename), frame.f_lineno
            self.interaction(frame, None)

    def getBreakpoints(self, filename):
        """
        Remember that we need to return these rows so ACE can use them
        with the setBreakpoints function.
        They start indexing rows in 0, so we need to substract 1 to every
        line with a breakpoint
        """
        breaks = self.breaks.get(filename)
        if breaks:
            return ':'.join([str(i-1) for i in breaks])

        return

    def addBreakpoint(self, filename, line, condition=None, temporary = 0):
        """
        This will add a breakpoint to the program.
        based on do_break in PDB.
        """
        funcname = None
        f = self.lookupmodule(filename)
        if not f:
            # This should not happen
            return False
        else:
            filename = f
        try:
            lineno = int(line)
        except ValueError, msg:
            # This should not happen
            return

        # Check for reasonable breakpoint
        line = self.checkline(filename, lineno)
        if line:
            # now set the break point
            err = self.set_break(filename, line, temporary, condition, funcname)
            if err:
                return False
            else:
                return True

        return False

    def removeBreakpoint(self, filename, line):

        lineno = int(line)
        err = self.clear_break(filename, lineno)
        if err:
            return False

        return True

    def interaction(self, frame, traceback):
        self.valid_read = False
        self.setup(frame, traceback)
        while not self.valid_read:
            self.stopped = True
            self.http.handle_request()
        self.stopped = False
        self.forget()

    def do_continue(self):
        # Run self.set_continue() modified
        self._set_stopinfo(self.botframe, None, -1)
        return True
    do_c = do_cont = do_continue

    def do_next(self):
        self.set_next(self.curframe)
        return True
    do_n = do_next

    def do_step(self):
        self.set_step()
        return True
    do_s = do_step

    def do_return(self):
        self.set_return(self.curframe)
        return True
    do_r = do_return

    def handle_command(self):
        try:
            command = self.params['command']
            print "#### HANDLE: %s"%command
            del(self.params['command'])
            self.result = getattr(self, "do_%s"%command)(**self.params)
        except:
            self.result = ""


    def do_POST(self):
        """
        POST handler

        POST handling was taken from
        http://blog.doughellmann.com/2007/12/pymotw-basehttpserver.html
        """

        # XXX: Need to do stronger checks, and proper data return in case
        # of possible errors
        self.params = {}
        self.results = ""

        content = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD':'POST',
                             'CONTENT_TYPE':self.headers['Content-Type'],
                             })

        for key in content.keys():
            self.params[key] = content[key].value

        print self.params
        self.handle_command()

        # Begin the response
        self.send_response(200)

        instance_port = config.getConfiguration().servers[0].port

        self.send_header("Access-Control-Allow-Origin", "http://localhost:%s" % instance_port)
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.end_headers()
        self.wfile.write(self.result)

        self.valid_read = True

        return
