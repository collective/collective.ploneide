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
    <li>
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

namespace_template = """
    <li>
        <a href="#"
           class="namespace-element"
           data-namespace="%(namespace)s">
            <span>%(id)s</span>
        </a>
    </li>
"""


def ZCMLDirectives():
    cur_dir = os.getcwd()
    namespaces = os.listdir('directives')
    html = ""

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

        html += directive_namespace_template % dict(namespace=namespace,
                                                    directives=directives)

    return html


def ZCMLNamespaces():
    cur_dir = os.getcwd()
    namespaces = os.listdir('namespaces')
    html = ""

    for namespace_id in namespaces:
        namespace_file = open(os.path.join(cur_dir, 'namespaces', namespace_id))
        html += namespace_template % dict(namespace=namespace_file.read(),
                                          id=namespace_id)

    return html


def ZCMLDirectiveHTML(zcml_directive, index):
    cur_dir = os.getcwd()

    namespace, directive = zcml_directive.split(":")

    html_part = open(os.path.join(cur_dir, 'directives', namespace, directive, 'zcml_frontend_part.html'))

    return html_part.read() % dict(element_number=index)
