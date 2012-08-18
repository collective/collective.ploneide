from pep8 import BaseReport
from pep8 import StyleGuide


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

        if code and (self.counters[code] == 1):
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