import os

def open_file(directory, file_name):
    result = None
    if directory and file_name:
        to_open = os.path.join(directory, file_name)
        text = file(to_open, 'r')
        result = text.read()
        text.close()

    return result


def save_file(directory, file_name, content):
    result = None
    if directory and file_name:
        to_open = os.path.join(directory, file_name)
        result = to_open
        text = file(to_open, 'w')
        text.write(content)
        text.close()

    return result
    