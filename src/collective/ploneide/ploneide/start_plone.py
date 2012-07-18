
import SimpleHTTPServer
import SocketServer

import sys
import os
import BaseHTTPServer
import logging
import cgi
import re
import json
import urllib2

import Zope2.Startup.run
from debugger import Debugger

from config import Config

#from threading import Thread

#from config import HOST
#from config import PORT

FORMAT = '%(asctime)-15s %(message)s'
logging.basicConfig(format=FORMAT)

logger = logging.getLogger("collective.ploneide: ")


try:
    # This will run in monkey patches giving in the fork reload
    # support for plone
    import sauna.reload
    FROM_FINLAND_WITH_LOVE=True
except ImportError:
    print "No sauna.reload available"
    FROM_FINLAND_WITH_LOVE=False

def warm_up_the_sauna(config):
    """
    Configure in sauna.reload auto-reloading of SRC modules.
    """

    print "Configuring module auto-reload"

    # XXX: Do not assume getcwd() is buildout root, but get in from some opts

    from sauna.reload.reloadpaths import ReloadPaths
    sauna.reload.reload_paths = ReloadPaths(config.devel_dirs.values())

    from sauna.reload import autoinclude, fiveconfigure
    from sauna.reload import reload_paths
    from sauna.reload import monkeypatcher

    monkeypatcher.PATCHED = True

    if reload_paths:
        # 1) Defer autoinclude of packages found under reload paths.
        autoinclude.defer_paths()
        # 2) Prevent Five from finding packages under reload paths.
        fiveconfigure.defer_install()


if __name__ == '__main__':

    debug_host = sys.argv[1]
    debug_port = int(sys.argv[2])

    load_sauna = sys.argv[3] == 'true' and True or False
    load_debugger = sys.argv[4] == 'true' and True or False

    plone_conf_file = sys.argv[5]

    config = Config(plone_conf_file)

    zope_main = Zope2.Startup.run.__file__

    if zope_main.endswith(".pyc"):
        # Run as .py file
        zope_main = zope_main[:-1]

    # Tinker with command-line to emulate normal Zope launch
    sys.argv = [ zope_main, "-X", "debug-mode=on", "-C", config.zope_conf_file]

    # Instead of spawning zopectl and Zope in another process, execute Plone in the context of this Python interpreter
    # to have pdb control over the code
    #print "Executing: %s %s" % (zope_main, sys.argv)

    if FROM_FINLAND_WITH_LOVE and load_sauna:
        warm_up_the_sauna(config)

    bootstrap = "import Zope2.Startup.run ; Zope2.Startup.run.run()"

    debug = Debugger(debug_host, debug_port)

    debug.run(bootstrap)
