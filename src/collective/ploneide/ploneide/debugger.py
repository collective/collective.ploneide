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


line_prefix = '\n-> '


class Debugger(bdb.Bdb, BaseHTTPServer.BaseHTTPRequestHandler):
    """
    Main debugger for PloneIDE.
    Most of this was taken from PDB
    """

    def __call__(self, request, client_address, server):
        try:
            BaseHTTPServer.BaseHTTPRequestHandler.__init__(self, request, client_address, server)   
        except:
            pass

    def __init__(self):
        # print "####################### INIT ################"
        # self.print_stack_trace()

        self.debugger_commands = {'is-stopped': self.is_stopped,
                                  'get-debugger-scope': self.get_scope,
                                  'add-watched-variable': self.add_watched_variable,
                                  'eval-code': self.eval_code,}

        bdb.Bdb.__init__(self)
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
            # print "IS_STOPPED: ", "%s:%s" %(self.canonic(self.curframe.f_code.co_filename),
            #                                 self.curframe.f_lineno)
            result = "%s:%s" %(self.canonic(self.curframe.f_code.co_filename),
                            self.curframe.f_lineno)

        else:
            result = ""

        return result

    # def trace_dispatch(self, arg1, arg2, arg3):
    #     # print "######## trace dispatch ##########"
    #     # import pdb;pdb.set_trace()  
    #     bdb.Bdb.trace_dispatch(self, arg1, arg2, arg3)
    #     stack, curindex = self.get_stack(arg1, None)
    #     curframe = stack[curindex][0]
    #     print "%s:%s" %(self.canonic(curframe.f_code.co_filename),
    #                     curframe.f_lineno)

        # print "%s:%s" %(self.canonic(self.curframe.f_code.co_filename),
        #                     self.curframe.f_lineno)

    def dispatch_call(self, frame, arg):
        # XXX 'arg' is no longer used
        if self.botframe is None:
            # First call of dispatch since reset()
            self.botframe = frame.f_back # (CT) Note that this may also be None!
            return self.trace_dispatch
        # if not (self.stop_here(frame) or self.break_anywhere(frame)):
        #     # No need to trace this function
        #     return # None
        self.user_call(frame, arg)
        if self.quitting: raise BdbQuit
        return self.trace_dispatch

    # def trace_dispatch(self, frame, event, arg):
    #     if self.quitting:
    #         print "self.quitting"
    #         return # None
    #     if event == 'line':
    #         if 'debugger.py' in self.canonic(frame.f_code.co_filename):
    #             print "trace_dispatch line:", self.canonic(frame.f_code.co_filename), frame.f_lineno
    #             print "Stop here: ", self.stop_here(frame)
    #             print "break here: ", self.break_here(frame)
    #             print "STOP HERE"
    #             print "self.skip", self.skip
    #             try:
    #                 print "self.is_skipped_module", self.is_skipped_module(frame.f_globals.get('__name__'))
    #             except:
    #                 pass
    #             print "frame is self.stopframe", frame is self.stopframe
    #             print "frame is self.botframe", frame is self.botframe
    #             print "BREAK HERE"
    #             filename = self.canonic(frame.f_code.co_filename)
    #             print "filename in self.breaks", filename in self.breaks
    #             lineno = frame.f_lineno
    #             try:
    #                 print "lineno in self.breaks[filename]", lineno in self.breaks[filename]
    #                 lineno = frame.f_code.co_firstlineno
    #                 print "lineno in self.breaks[filename]", lineno in self.breaks[filename]
    #             except:
    #                 pass

    #         return self.dispatch_line(frame)
    #     if event == 'call':
    #         if 'debugger.py' in self.canonic(frame.f_code.co_filename):
    #             print "trace_dispatch call:", self.canonic(frame.f_code.co_filename), frame.f_lineno
    #             print "Stop here: ", self.stop_here(frame)
    #             print "break anywhere: ", self.break_anywhere(frame)
    #             print "STOP HERE"
    #             print "self.skip", self.skip
    #             try:
    #                 print "self.is_skipped_module", self.is_skipped_module(frame.f_globals.get('__name__'))
    #             except:
    #                 pass
    #             print "frame is self.stopframe", frame is self.stopframe
    #             print "frame is self.botframe", frame is self.botframe
    #             print "BREAK ANYWHERE"
    #             print self
    #             print "self.canonic(frame.f_code.co_filename) in self.breaks", self.canonic(frame.f_code.co_filename) in self.breaks
    #             print "self.breaks", self.breaks
    #             print "self.canonic(frame.f_code.co_filename)", self.canonic(frame.f_code.co_filename)

    #         return self.dispatch_call(frame, arg)
    #     if event == 'return':
    #         # print "return"
    #         return self.dispatch_return(frame, arg)
    #     if event == 'exception':
    #         # print "exception"
    #         return self.dispatch_exception(frame, arg)
    #     if event == 'c_call':
    #         # print "c_call"
    #         return self.trace_dispatch
    #     if event == 'c_exception':
    #         # print "c_exception"
    #         return self.trace_dispatch
    #     if event == 'c_return':
    #         # print "c_return"
    #         return self.trace_dispatch
    #     print 'bdb.Bdb.dispatch: unknown debugging event:', repr(event)
    #     return self.trace_dispatch

    def set_dispatcher(self):
        # print "######## set dispatcher ##########"
        self.can_debug = False
        frame = sys._getframe().f_back
        self.reset()
        while frame:
            frame.f_trace = self.trace_dispatch
            self.botframe = frame
            frame = frame.f_back
        self.set_continue()
        sys.settrace(self.trace_dispatch)
        threading.settrace(self.trace_dispatch)

    def remove_dispatcher(self):
        # print "######## remove dispatcher ##########"
        self.can_debug = False
        sys.settrace(None)
        threading.settrace(None)

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

    def create_server(self, debugger_host, debugger_port):        
        server_address = (debugger_host, debugger_port)
        self.http = BaseHTTPServer.HTTPServer(server_address, self)


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
        # print "Call:", self.canonic(frame.f_code.co_filename), frame.f_lineno
        # print "Can debug", self.can_debug
        # print "stop here", self.stop_here(frame)
        
        if self.can_debug and self.stop_here(frame):
            #print "Call:", self.canonic(frame.f_code.co_filename), frame.f_lineno
            self.interaction(frame, None)

    def user_line(self, frame):
        """
        This function is called when we stop or break at this line.
        """
        # print "Line:", self.canonic(frame.f_code.co_filename), frame.f_lineno
        # print "Can debug", self.can_debug
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
        # print "######## get breakpoints ##########"
        breaks = self.breaks.get(filename)
        if breaks:
            return ':'.join([str(i-1) for i in breaks])

        return

    def addBreakpoint(self, filename, line, condition=None, temporary=False):
        """
        This will add a breakpoint to the program.
        based on do_break in PDB.
        """
        # print "######## add breakpoint ##########"
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
            # print self.breaks
            if err:
                return False
            else:
                return True

        return False

    def removeBreakpoint(self, filename, line):
        # print "######## remove breakpoints ##########"
        lineno = int(line)
        err = self.clear_break(filename, lineno)
        if err:
            return False

        return True

    def interaction(self, frame, traceback):
        # print "######## interaction ##########"
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
            # print "#### HANDLE: %s"%command
            del(self.params['command'])

            if command in self.debugger_commands:
                self.result = self.debugger_commands[command](**self.params)
            else:
                self.result = getattr(self, "do_%s"%command)(**self.params)
                self.valid_read = True
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
        self.result = ""

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

        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.end_headers()

        # print "TO RETURN:", self.result
        self.wfile.write(self.result)

        return

    def do_GET(self):
        """
        GET handler
        """

        # XXX: Need to do stronger checks, and proper data return in case
        # of possible errors
        #import pdb;pdb.set_trace()

        self.params = {}
        self.result = False

        # print "DO_GET", self.path

        self.send_response(200) 

        instance_port = config.getConfiguration().servers[0].port

        self.send_header("Access-Control-Allow-Origin", "http://localhost:%s" % instance_port)
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

        self.end_headers()

debug = Debugger()
