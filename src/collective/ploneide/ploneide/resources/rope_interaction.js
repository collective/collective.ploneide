
function getCodeDefinition(){

    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    var code = env.editor.session.getValue();
    var position = env.editor.getCursorPosition();

    $.ajax({
            url: url,
            async: true,
            type: 'POST',
            // timeout: 30000,
            data: {'command': 'get-code-definition',
                   'code': code,
                   'line': position.row,
                   'column': position.column},
            success: function(results){
                if (results != "False" && results != ""){
                    var split = results.split(":");
                    var full_path = split[0];
                    var lineno = split[1];
                    loadFileFromFullPath(full_path);
                    env.editor.scrollToLine(lineno, true);
                }
            }
    });
}

