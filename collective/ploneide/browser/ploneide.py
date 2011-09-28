from zope.interface import implements
from Products.Five.browser import BrowserView
from plone.reload.browser import Reload
from Acquisition import aq_inner

from interfaces import IPloneideView
from interfaces import IPloneideDebugView
from interfaces import IListDirectory
from interfaces import ISaveAsView
from interfaces import ITestDir
from interfaces import IContextInfoView

from Products.CMFCore.utils import getToolByName
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile

from collective.ploneide.debug import debugger
from collective.ploneide.ide_server import httpd

from collective.ploneide.config import AUX_HOST
from collective.ploneide.config import AUX_PORT
from collective.ploneide.config import DEBUGGER_HOST
from collective.ploneide.config import DEBUGGER_PORT

from zope.traversing.namespace import nsParse, namespaceLookup
from zope.publisher.interfaces import IPublishTraverse
from Acquisition.interfaces import IAcquirer
from zope.component import queryMultiAdapter
from ZPublisher.BaseRequest import DefaultPublishTraverse

from Products.CMFCore.FSPageTemplate import FSPageTemplate

from Products.ATContentTypes.interfaces import IATContentType

from os.path import join, getsize

import os
import sys
import re
import json
import threading
import bdb
import inspect
from ordereddict import OrderedDict

class PloneideView(BrowserView):
    implements(IPloneideView)

    pt = ViewPageTemplateFile('templates/ploneide.pt')

    def __call__(self):
        debugger.set_dispatcher()
        return self.pt()

    def getCurrentEggs(self):
        # This should get a cleaner implementation.
        # I'm doing this as a proof of concept

        eggs = []
        for i in sys.path:
            if i.endswith("/bin"):
                # End of the paths list
                break
            else:
                eggs.append((i, i.split("/")[-1]))

        eggs.sort(key=lambda egg:egg[1])
        
        return eggs

    def getDevelopEggs(self):
        """retrieve the eggs categorized like on develop"""
        #we should get the eggs list parsing the buildout.cfg file.
        eggs = []
        for directory in sys.path:
            #FIXME
            if '/src/' in directory:
                eggs.append((directory, os.path.split(directory)[-1]))

        return eggs

    def getAuxiliarServer(self):
        text = """
        <script type="text/javascript">
            AUX_HOST="%s";
            AUX_PORT=%s;
        </script>
        """ % (AUX_HOST, AUX_PORT)
        return text
        
    def getDebuggerServer(self):
        text = """
        <script type="text/javascript">
            DEBUGGER_HOST="%s";
            DEBUGGER_PORT=%s;
        </script>
        """ % (DEBUGGER_HOST, DEBUGGER_PORT)
        return text
 
 
class IdeBaseView(PloneideView):
    """
    """
    pt = ViewPageTemplateFile('templates/idebase.pt')

 
#
#ignore_directories = '.svn', 'CVS'
#def _dir_hash(dir):
#    hash = md5()
#    for (dirpath, dirnames, filenames) in os.walk(dir):
#        dirnames[:] = [n for n in dirnames if n not in ignore_directories]
#        filenames[:] = [f for f in filenames
#                        if (not (f.endswith('pyc') or f.endswith('pyo'))
#                            and os.path.exists(os.path.join(dirpath, f)))
#                        ]
#        hash.update(' '.join(dirnames))
#        hash.update(' '.join(filenames))
#        for name in filenames:
#            hash.update(open(os.path.join(dirpath, name)).read())
#    return hash.digest().encode('base64').strip()

class SaveAsView(PloneideView):
    implements(ISaveAsView)
    
    pt = ViewPageTemplateFile('templates/save_as.pt')

class ListDirectoryTree(BrowserView):

    def directory_content_ajax(self, directory=''):

        if directory:
            # Files to exclude
            files_to_exclude = re.compile(r".*(pyc)$|.*~$")
            dirs_to_exclude = re.compile(r"\A(\.)")
            contents = []
            os.chdir(directory)
            dir_contents = os.listdir('.')
            

            files = [i for i in dir_contents if (not os.path.isdir(i) and 
                                                     not files_to_exclude.match(i))]

            dirs = [i for i in dir_contents if (os.path.isdir(i) and 
                                                not dirs_to_exclude.match(i))]
            
            files.sort()
            dirs.sort()
            raw_json_dirs = [{'title':x, 'metatype':'folder', 'folderish':'true', 'rel': directory+'/'+x} for x in dirs]
            raw_json_files = [{'title':x, 'metatype':'page', 'rel': directory+'/'+x} for x in files]
            return json.dumps(raw_json_dirs + raw_json_files)
        return
                 
            
class ListDirectory(BrowserView):
    implements(IListDirectory)

    def getDirectoryContents(self):

        # Files to exclude
        files_to_exclude = re.compile(r".*(pyc)$|.*~$")
        dirs_to_exclude = re.compile(r"\A(\.)")
        
        directory = self.request.get('directory', None)
        no_files = self.request.get('no_files', None)

        if not directory:
            directory = '/'
            
        contents = []
        os.chdir(directory)
        dir_contents = os.listdir('.')
        
        if no_files:
            files = []
        else:
            files = [i for i in dir_contents if (not os.path.isdir(i) and 
                                                 not files_to_exclude.match(i))]
            
            
        dirs = [i for i in dir_contents if (os.path.isdir(i) and 
                                            not dirs_to_exclude.match(i))]
        
        files.sort()
        dirs.sort()
        
        
        return ['..'] + dirs + files

class TestDir(BrowserView):
    implements(ITestDir)

    def __call__(self):
        directory = self.request.get('directory')
        new_dir = self.request.get('new_dir')

        path = os.path.join(directory, new_dir)
        path = os.path.realpath(path)

        #XXX: Redo this using os.path.exists
        try:
            contents = os.listdir(path)
            result = path
        except:
            result = False
                

        return result

class ContextInfoView(BrowserView):
    implements(IContextInfoView)

    def getContentType(self):
        result = {}
        
        if IATContentType.providedBy(self.context):
            py_file = inspect.getsourcefile(self.context.__class__)
                    
            result['meta_type'] = self.context.meta_type
            result['portal_type'] = self.context.portal_type
            result['py_file'] = py_file
            
        return result
        
    def getSchemaForContentType(self):
        result = OrderedDict()
        schema = self.context.Schema()
        
        field_ids = schema.keys()
        field_ids.sort()
        
        for i in field_ids:
            field = schema[i]
            widget = field.widget
            field_py_file = inspect.getsourcefile(field.__class__)
            field_py_lineno = inspect.getsourcelines(field.__class__)[1]
            
            widget_py_file = inspect.getsourcefile(widget.__class__)
            widget_py_lineno = inspect.getsourcelines(widget.__class__)[1]
            
            label = widget.label
            
            condition = widget.getCondition()
            visibility = widget.visible
            
            result[i] = {'field' : field.__class__.__name__,
                         'field_py_file' : field_py_file,
                         'field_py_lineno' : field_py_lineno,
                         'widget' : widget.__class__.__name__,
                         'widget_py_file' : widget_py_file,
                         'widget_py_lineno' : widget_py_lineno,
                         'label' : label,
                         'condition' : condition,
                         'visibility' : visibility,}
                         
                         
        return result

    def getProvidedInterfaces(self):
        i_provided = self.context.__provides__.__iro__
        i_list = ["%s.%s"%(i.__module__, i.getName()) for i in i_provided]
        return i_list

    def getDefaultPage(self):
        if self.context.getDefaultPage() == self.context.defaultView():
            return self.context.restrictedTraverse('front-page')
        else:
            return None
        
    def getAllowedViews(self):
        """
        This method will return a dict containing the view name as keys
        and filesystem full path to both page template files and python
        files, according if it is a BrowserView or a FSPageTemplate
        """
        
        pt = getToolByName(self.context, 'portal_types')
        portal_type = self.context.portal_type
        dvt = pt[portal_type]
        
        result  = {}
        # The following was taken from traverseName function from 
        # ZPublisher/BaseRequest.py
        for view in dvt.view_methods:
            if view[:1] in '@+':
                # Process URI segment parameters.
                ns, nm = nsParse(view)
                if ns:
                    try:
                        ob = namespaceLookup(ns, nm, self.context, self.request)
                    except TraversalError:
                        result[view] = {}
                        continue
    
                    if IAcquirer.providedBy(ob):
                        ob = ob.__of__(self.context)
                    
            else:
                if IPublishTraverse.providedBy(self.context):
                    ob = self.context.publishTraverse(self.request, view)
                else:
                    adapter = queryMultiAdapter((self.context, self.request), 
                                                IPublishTraverse)
                    if adapter is None:
                        ## Zope2 doesn't set up its own adapters in a lot of cases
                        ## so we will just use a default adapter.
                        adapter = DefaultPublishTraverse(self.context, self.request)
        
                    ob = adapter.publishTraverse(self.request, view)
                    
                         
            if isinstance(ob, BrowserView):
                # Taken from five.customerize.browser
                klass = ob.__class__
                base = klass.__bases__[0]
                if base is BrowserView or base is object:
                    py_file = inspect.getsourcefile(klass)
                else:
                    py_file = inspect.getsourcefile(base)
                pt_file = ob.index.filename
                
                result[view] = {'py':py_file,
                                'pt':pt_file}
                                
            elif isinstance(ob, FSPageTemplate):
                result[view] = {'pt':ob.getObjectFSPath()}
 
            else:
                result[view] = {}
                
                
        return result

    def getWorkflowPolicy(self):
        workflowTool = getToolByName(self.context, "portal_workflow")
        status = workflowTool.getStatusOf("plone_workflow", self.context)
        wf_chain = workflowTool.getChainFor(self.context)
        wf = None
        if wf_chain:
            wf = workflowTool[wf_chain[0]]
        
        return wf

class ReloadPlone(Reload):
    
    def testMethod(self):
        a = 2
        
        return a
        
    def __call__(self):
        
        plone_reload = self.request.form.get('plone.reload', None)
        plone_restart = self.request.form.get('plone.restart', None)
        
        a = self.testMethod()
        while a < 50:
            a += 1
            
        
        if plone_reload:
            Reload.__call__(self)
            
        if plone_restart:
            raise bdb.BdbQuit
#            context = aq_inner(self.context)
#            cpanel = context.unrestrictedTraverse('/Control_Panel')
#            url = self.request.get('URL')
#            cpanel.manage_restart(url)
#            self.message = "Plone restarted."
#            
        return self.index()

    def isRestartable(self):
#        if os.environ.has_key('ZMANAGED'):
#            return True
#        return False
        return True
        
    def status(self):
        return self.message
