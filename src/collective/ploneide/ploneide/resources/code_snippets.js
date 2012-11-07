
function GetAvailableCategories(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'get-available-snippets-categories'},
            async : true,
            success: function(results){
                var categories = JSON.parse(results);
                for (var i = 0; i < categories.length; i++) {
                    var option = $("<option></option>");
                    option.attr("value", categories[i]);
                    option.html(categories[i]);
                    $("#snippets-categories").append(option);
                };
            }
        });

}

function chosenCategory(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    var category = $("#snippets-categories").val();

    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'get-snippets-for-category',
                   'category': category},
            async : true,
            success: function(results){
                var snippets = JSON.parse(results);
                for (var i = 0; i < snippets.length; i++) {
                    var option = $("<option></option>");
                    option.attr("value", snippets[i][0]);
                    option.html(snippets[i][1]);
                    $("#snippets-list").append(option);
                };
            }
        });
}

function chosenSnippet(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    var category = $("#snippets-categories").val();
    var snippet_id = $("#snippets-list").val();

    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'get-snippet',
                   'category': category,
                   'snippet_id': snippet_id},
            async : true,
            success: function(results){
                var snippets = JSON.parse(results);
                $("#snippet-placeholder").val(snippets.template);

                var vars = snippets.vars;

                var table = $("<table></table>");

                for (var i = 0; i < vars.length; i++) {
                    var id = vars[i][0];
                    var default_value = vars[i][1];

                    var fieldname = $("<span></span>");
                    fieldname.html(id);
                    var input = $("<input type=\"text\" id=\"" + id + "\" name=\"" + id + "\" />");
                    var span = $("<span></span>");
                    span.html("(Default value: "+default_value+")");

                    var tr = $("<tr></tr>");

                    var fieldname_td = $("<td></td>");
                    fieldname_td.append(fieldname);
                    tr.append(fieldname_td);
                    
                    var input_td = $("<td></td>");
                    input_td.append(input);
                    tr.append(input_td);

                    var span_td = $("<td></td>");
                    span_td.append(span);
                    tr.append(span_td);

                    table.append(tr);
                };

                var h1 = $("<h1></h1>");
                h1.html("Variables:");
                $("#variables-wrapper").append(h1);
                $("#variables-wrapper").append(table);
            }
        });
}

function insertSnippet(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    var code = env.editor.session.getValue();
    var position = env.editor.getCursorPosition();

    var category = $("#snippets-categories").val();
    var snippet_id = $("#snippets-list").val();

    var variables = {};

    $.each($("#variables-wrapper table input"), 
           function(index, value){
                variables[value.id] = value.value;
           }
    )

    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'insert-snippet-into-code',
                   'category': category,
                   'snippet_id': snippet_id,
                   'variables': JSON.stringify(variables),
                   'code': code,
                   'line': position.row,
                   'column': position.column},
            async : true,
            success: function(results){
                env.editor.session.doc.setValue(JSON.parse(results));
                // Should we close the snippets overlay?
                //XXX: Figure out if there's a more proper way of doing this
                $(".ui-dialog-titlebar-close").click();
            }
        });

}