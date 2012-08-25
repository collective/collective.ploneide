from zope.interface import implements

from Products.Five.browser import BrowserView

from interfaces import IStartDebugger
from interfaces import IStopDebugger
from interfaces import IAddBreakpoint
from interfaces import IRemoveBreakpoint
from interfaces import IGetBreakpoints
from interfaces import ITestView

from collective.ploneide.ploneide.debugger import debug

class StartDebugger(BrowserView):
    implements(IStartDebugger)

    def __call__(self):
        debug.set_dispatcher()
        debug.start_debugging()

class StopDebugger(BrowserView):
    implements(IStopDebugger)

    def __call__(self):
        debug.remove_dispatcher()
        debug.stop_debugging()

class AddBreakpoint(BrowserView):
    implements(IAddBreakpoint)

    def __call__(self):
        filename = self.request.get('filename', None)
        line = self.request.get('line', None)
        condition = self.request.get('condition', None)

        if condition == "None":
            condition = None

        if filename and line:
            debug.addBreakpoint(filename, 
                                line, 
                                condition=condition)
        return ""

class RemoveBreakpoint(BrowserView):
    implements(IRemoveBreakpoint)

    def __call__(self):
        filename = self.request.get('filename', None)
        line = self.request.get('line', None)

        if filename and line:
            debug.removeBreakpoint(filename, line)

        return ""

class GetBreakpoints(BrowserView):
    implements(IGetBreakpoints)

    def __call__(self):
        import pdb;pdb.set_trace()

class TestView(BrowserView):
    implements (ITestView)
    
    def blah(self):
        return 1
        
    def blah2(self):
        return 2
        
    def __call__(self):
        from time import sleep
        sleep(2)
        for i in range(10):
            i
        self.blah()
        self.blah2()
        return "Test"