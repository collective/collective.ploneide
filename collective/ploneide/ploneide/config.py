import ConfigParser

class Config:

    def __init__(self, config_file):
        self.config_file = config_file
        self.loadConfigFile()

    def loadConfigFile(self):
        config = ConfigParser.RawConfigParser()
        config.read(self.config_file)

        self.buildout_dir = config.get("Directories", "buildout")

        # XXX: I'm positive that we can trust the following line *ALWAYS*, this
        #      is a devel tool, running localhost, so if this line introduces
        #      a security risk, then maybe you have bigger problems in your
        #      hands. However, should we replace following line with
        #      ast.literal_eval ?
        self.devel_dirs = eval(config.get("Directories", "devel"))

        self.instance_host = config.get("Servers", "instance-host")
        self.instance_port = config.getint("Servers", "instance-port")
        self.ploneide_host = config.get("Servers", "ploneide-host")
        self.ploneide_port = config.getint("Servers", "ploneide-port")
        self.debug_host = config.get("Servers", "debug-host")
        self.debug_port = config.getint("Servers", "debug-port")
