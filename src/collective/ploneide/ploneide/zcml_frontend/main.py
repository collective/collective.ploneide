import os


directive_namespace_template = """
    <li class="directive-sub-menu">
        <a href="#">
            <span>%(namespace)s</span>
        </a>
        <ul>        
            %(directives)s
        </ul>
    </li>
"""

directive_template = """
    <li class="directive">
        <a href="#"
           class="directive-element"
           data-directive="%(namespace)s:%(id)s">
            <span>%(title)s</span>
        </a>
        <a href="%(help_url)s"
           title="%(help_text)s" 
           id="%(id)s-directive"
           target="_blank"
           class="directive-help"
           name="%(namespace)s_%(id)s-directive">
            <img src="resources/icons/help.png"
                 i18n:attributes="alt" />
        </a>
    </li>
"""


class ZCMLDirectives(object):

    def __init__(self):
        # import pdb;pdb.set_trace()
        cur_dir = os.getcwd()
        namespaces = os.listdir('directives')
        self.html = ""

        for namespace in namespaces:
            namespace_dir = os.path.join(cur_dir, 'directives', namespace)
            directives = ""

            for directive in os.listdir(namespace_dir):
                directive_dir = os.path.join(namespace_dir, directive)
                metadata = open(os.path.join(directive_dir, 'metadata'))

                # XXX: This needs to be rewritten in a more appropriate way
                title = ""
                help_text = ""
                help_url = ""

                for line in metadata:
                    if line.startswith('title'):
                        title = line[7:-2]
                    elif line.startswith('help_text'):
                        help_text = line[11:-2]
                    elif line.startswith('help_url'):
                        help_url = line[10:-2]

                directives += directive_template % dict(namespace=namespace,
                                                        id=directive,
                                                        title=title,
                                                        help_url=help_url,
                                                        help_text=help_text)

            self.html += directive_namespace_template % dict(namespace=namespace,
                                                             directives=directives)



    def toString(self):
        return self.html