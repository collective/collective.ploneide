from zope.interface import Interface

class IStartDebugger(Interface):
    """
    This view will set the system dispatcher to allow debugging
    """

class IStopDebugger(Interface):
    """
    This view will unset the system dispatcher to stop debugging
    """

class IAddBreakpoint(Interface):
    """
    This view will set the system dispatcher to allow debugging
    """

class IRemoveBreakpoint(Interface):
    """
    This view will unset the system dispatcher to stop debugging
    """

class IGetBreakpoints(Interface):
    """
    This view will unset the system dispatcher to stop debugging
    """

class ITestView(Interface):
    """
    This view will set the system dispatcher to allow debugging
    """




class IPloneideView(Interface):
    """
    This view will contain the editor
    """

class IPloneideDebugView(Interface):
    """
    This view will contain the editor in debug mode
    """

class IListDirectory(Interface):
    """
    This view will list all directory contents
    """

class ISaveAsView(Interface):
    """
    A view that will save a file to the filesystem
    """

class ITestDir(Interface):
    """
    A view that will test if a directory exists in the filesystem.
    In case it does, then the new full path is returned.
    Otherwise, False is returned
    """

class IContextInfoView(Interface):
    """
    This view will render all sort of useful information for the current context
    """

class IlocalVariablesBox(Interface):
    """
    A view that will show a list of variables from the local scope
    and their value
    """
 
class IglobalVariablesBox(Interface):
    """
    A view that will show a list of variables from the global scope
    and their values
    """

class IconsoleBox(Interface):
    """
    This view will render a textarea with an input box, that will allow
    to run arbitrary code to test the output
    """
    
class IwatchedVariablesBox(Interface):
    """
    This view will allow the user to enter custom variables to be watched
    through the execution of the debugger.
    """
