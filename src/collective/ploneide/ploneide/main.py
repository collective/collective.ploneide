"""



"""

import os
import tornado
import sys

import candc
from ploneide import PloneIDEServer, PloneIDEHandler

from config import Config

PATH = os.path.dirname(__file__)

def temp_tornado_thread():
    """
    XXX: Merge simple HTTP server code to Tornado and let it handle everything.
    """
    print "HAHAHAHA!"
    candc.application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()

def main(config_file=None):
    """ """

    if not config_file:
        print "You need to provide a valid config file"
        sys.exit(1)

    print "Going to hurricane:" + PATH

    os.chdir(PATH)


    from thread import start_new_thread
    start_new_thread(temp_tornado_thread, ())

    config = Config(config_file)

    httpd = PloneIDEServer(config, PloneIDEHandler)


    try:
        httpd.run()
    except KeyboardInterrupt:
        httpd.stop()


if __name__ == "__main__":
    main()


