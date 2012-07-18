"""

    Command & Control server for Plone IDE.


    This server communicates on the native layer e.g. start/stops
    processing over full duplex Socket.IO channel to the Javascript layer.


"""

import tornado
import tornadio

class CCConnection(tornadio.SocketConnection):

    def on_message(self, message):
        print "Ich bin ein mezzage"
        pass


CCRouter = tornadio.get_router(CCConnection)

application = tornado.web.Application([CCRouter.route()], socket_io_port = 8085)

