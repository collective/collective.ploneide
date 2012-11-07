
import os 
import string

import ConfigParser


class CodeSnippets(object):

    def __init__(self):
        print "Loading code snippets..."
        old_cwd = os.getcwd()
        os.chdir(os.path.join(os.path.dirname(__file__), 'templates'))

        self.snippets = {}

        for category in os.listdir('.'):
            os.chdir(category)

            for snippet_id in os.listdir('.'):
                os.chdir(snippet_id)

                metadata = ConfigParser.RawConfigParser()
                metadata.read("metadata")

                snippet_title = metadata.get("Default", "title")
                snippet_tags = eval(metadata.get("Default", "tags"))
                snippet_vars = eval(metadata.get("Default", "vars"))

                template = open('template', 'r').read()

                category_dict = self.snippets.get(category, {})

                category_dict[snippet_id] = {'title': snippet_title,
                                             'tags': snippet_tags,
                                             'vars': snippet_vars,
                                             'template': template}

                self.snippets[category] = category_dict

                os.chdir('..')

            os.chdir('..')

        os.chdir(old_cwd)

        print "Done"

    def get_categories(self):
        return self.snippets.keys()

    def get_snippets_for_category(self, category):
        category_dict = self.snippets.get(category, {})
        snippets = []

        for i in category_dict.keys():
            snippets.append(([i], category_dict[i]['title']))

        return snippets

    def get_snippet(self, category, snippet_id):
        category_dict = self.snippets.get(category, {})
        snippet = category_dict.get(snippet_id, {})

        return snippet


    def insert_snippet_into_code(self, category, snippet_id, variables, 
                                 code, line, column):

        category_dict = self.snippets.get(category, {})
        snippet = category_dict.get(snippet_id, {})

        # XXX: This should return an error message or something... doing this for now
        assert(len(variables) == len(snippet['vars']))

        # Put default values into not given values
        for var in snippet['vars']:
            if variables[var[0]] == u'':
                variables[var[0]] = var[1]

        template = string.Template(snippet['template'])
        result_snippet = template.safe_substitute(variables)

        splitted_snippet = result_snippet.split('\n')

        imports = False
        import_lines = []
        at_code = False
        code_lines = []

        for snippet_line in splitted_snippet:
            if snippet_line.strip() == u'# ** imports **': 
                at_code = False
                imports = True

            elif snippet_line.strip() == u'# ** code **': 
                at_code = True
                imports = False

            else:
                if imports:
                    # XXX: Naive way to know if the import is already present
                    #      replace this and use rope's import assist tools.
                    if snippet_line not in code:
                        import_lines.append(snippet_line)
                elif at_code:
                    # XXX: Stupid way to "know" the proper indentation
                    #      need to be smarter than this...
                    code_lines.append(' '*column + snippet_line)

        splitted_code = code.split('\n')

        # XXX: For now, we just put the imports on top. Replace this to use 
        #      rope and its import assist tools.
        resulting_code = '\n'.join(import_lines +
                                   splitted_code[0:line] + 
                                   code_lines + 
                                   splitted_code[line+1:])

        return {'code': resulting_code, 'lines': len(code_lines)}

codesnippets = CodeSnippets()


