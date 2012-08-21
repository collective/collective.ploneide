
import _ast

from pep8 import BaseReport
from pep8 import Checker as pep8_Checker
from pep8 import StyleGuide

from pyflakes.checker import Checker as pyflakes_Checker


class PloneIDEReport(BaseReport):
    """Collect and print the results of the checks."""

    def __init__(self):
        options = StyleGuide().options
        super(PloneIDEReport, self).__init__(options)

        self._all_errors = []

    def error(self, line_number, offset, text, check):
        """
        Report an error, according to options.
        """
        code = super(PloneIDEReport, self).error(line_number, offset,
                                                 text, check)

        if code:
            self._all_errors.append( {
                'line': self.line_offset + line_number, 
                'col': offset + 1,
                'code': code, 
                'message': text[5:],
                'type': 'warning',
            })

            # print(check.__doc__.lstrip('\n').rstrip())
        return code

    def get_file_results(self):
        return self._all_errors

class StaticCheck:
    """ This class will handle the static check """

    def __init__(self, code=""):
        self.pyflakes_errors = []
        self.pep8_errors = []
        self.compile_error = ""
        self.code = code

    def check_pep8(self):
        if self.code:
            lines = [i + '\n' for i in self.code.split('\n')]
            checker = pep8_Checker(None, report=PloneIDEReport())
            checker.lines = lines

            self.pep8_errors = checker.check_all()

    def check_pyflakes(self):
        if self.code:
            self.compile_error = ""
            try:
                tree = compile(self.code, "", "exec", _ast.PyCF_ONLY_AST)
            except SyntaxError, value:
                msg = value.args[0]

                (lineno, offset, text) = value.lineno, value.offset, value.text

                line = text.splitlines()[-1]

                if offset is not None:
                    offset = offset - (len(text) - len(line))

                self.compile_error = 'line %d: %s' % (lineno, msg)
                
                # TODO: Use offset to highlight the problem in the editor
                # if offset is not None:
                #     print >> sys.stderr, " " * offset, "^"

            else:
                # If it's syntacticaly valid, then check it.
                self.pyflakes_errors = []
                w = pyflakes_Checker(tree, "")
                for message in w.messages:
                    self.pyflakes_errors.append( {
                        'line': message.lineno, 
                        'col': 0, 
                        'message': message.message % message.message_args,
                        'type': 'warning',
                    })

    def get_results(self):
        return [self.pyflakes_errors, self.pep8_errors, self.compile_error]