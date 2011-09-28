from Products.Five.browser import BrowserView
from zope.interface import implements

from interfaces import IlocalVariablesBox
from interfaces import IglobalVariablesBox
from interfaces import IconsoleBox
from interfaces import IwatchedVariablesBox

class localVariablesBox(BrowserView):
    implements(IlocalVariablesBox)

class globalVariablesBox(BrowserView):
    implements(IglobalVariablesBox)

class consoleBox(BrowserView):
    implements(IconsoleBox)

class watchedVariablesBox(BrowserView):
    implements(IwatchedVariablesBox)
