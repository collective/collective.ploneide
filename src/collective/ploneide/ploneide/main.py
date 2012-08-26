"""



"""

import os
import tornado
import sys

import candc

from rope.base.libutils import analyze_modules
from rope.base.project import Project
from rope.base.taskhandle import TaskHandle

from ploneide import PloneIDEServer, PloneIDEHandler

from config import Config

PATH = os.path.dirname(__file__)


handle = TaskHandle("PloneIDE")
def update_progress():
    jobset = handle.current_jobset()
    if jobset:
        text = ''
        # getting current job set name
        if jobset.get_name() is not None:
            text += jobset.get_name()
        # getting active job name
        if jobset.get_active_job_name() is not None:
            text += ' : ' + jobset.get_active_job_name()
        # adding done percent
        percent = jobset.get_percent_done()
        if percent is not None:
            text += ' ... %s percent done' % percent
        print text

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

    config = Config(config_file)
    print "Tying the rope..."
    myproject = Project(config.buildout_dir+'/src', python_path=sys.path)
    handle.add_observer(update_progress)

    # analyze_modules(myproject, task_handle=handle)


    print "Done."

    print "Going to hurricane:" + PATH

    os.chdir(PATH)


    from thread import start_new_thread
    start_new_thread(temp_tornado_thread, ())

    httpd = PloneIDEServer(config, PloneIDEHandler, myproject, handle)

    try:
        httpd.run()
    except KeyboardInterrupt:
        print "Closing the project..."
        myproject.close()
        httpd.stop()


if __name__ == "__main__":
    main()


