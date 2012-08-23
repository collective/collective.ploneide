from zope.interface import implements

from Products.Five.browser import BrowserView

from interfaces import IStartDebugger
from interfaces import IStopDebugger

from collective.ploneide.ploneide.debugger import debug

class StartDebugger(BrowserView):
    implements(IStartDebugger)

    def __call__(self):
        print debug
        debug.set_dispatcher()
        debug.start_debugging()

class StopDebugger(BrowserView):
    implements(IStopDebugger)

    def __call__(self):
        debug.remove_dispatcher()
        debug.stop_debugging()

class TestView(BrowserView):
    implements (IStartDebugger)
    
    def __call__(self):
        return "Test"