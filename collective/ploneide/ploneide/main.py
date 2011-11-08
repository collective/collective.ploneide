"""



"""

import os
import tornado

import candc
from ploneide import PloneIDEServer, PloneIDEHandler

from config import HOST
from config import PORT

PATH = os.path.dirname(__file__)

def temp_tornado_thread():
    """
    XXX: Merge simple HTTP server code to Tornado and let it handle everything.
    """
    print "HAHAHAHA!"
    candc.application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()

def main():
    """ """


    print "Going to hurricane:" + PATH

    os.chdir(PATH)


    from thread import start_new_thread
    start_new_thread(temp_tornado_thread, ())

    #logger.setLevel('INFO')
    server_address = (HOST, PORT)
    httpd = PloneIDEServer(server_address, PloneIDEHandler)


    try:
        httpd.run()
    except KeyboardInterrupt:
        httpd.stop()


if __name__ == "__main__":
    main()


