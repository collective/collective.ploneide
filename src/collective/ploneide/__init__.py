  # -*- extra stuff goes here -*-
# This should not be needed anymore
#from collective.ploneide.debug import debugger

#import bdb
#import os
#import signal
#import sys
import logging

#import App.config

logger = logging.getLogger("collective.ploneide")

#def signal_handler(signal, frame):
    ## XXX: Figure a way to kill the internal server in a clean way
    #debugger.should_run = False
    #raise bdb.BdbQuit

#signal.signal(signal.SIGINT, signal_handler)

def initialize(context):
    """Initializer called when used as a Zope 2 product."""
