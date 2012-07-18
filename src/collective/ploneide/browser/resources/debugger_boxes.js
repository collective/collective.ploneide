function getDebuggerScope(scope){

    jQuery.ajax({type: 'POST',
                 url: 'http://'+AUX_HOST+':'+AUX_PORT,
                 async : true,
                 dataType : 'json',
                 data: {'command': 'get-debugger-scope',
                        'scope': scope},
                 success: function(results){
                     if (results != "False"){
                            var table = $(".debugger-scope-box."+scope+"-variable-box > table");
                            table.text('');
                            $.each(results, function(key, content){
                                var tr = $('<tr></tr>');
                                var td_k = $('<td></td>');
                                var td_v = $('<td></td>');
                                td_k.text(key);
                                td_v.text(content.value);
                                if (content.changed == "True"){
                                    tr.addClass("value_changed");
                                }
                                tr.append(td_k);
                                tr.append(td_v);
                                table.append(tr);
                            });
                               
                        }
                        else{
                            //XXX: SHall we delete the scope table or leave it ?
                        }
                     }
                });
}

function getDebuggerLocalScope(){
    getDebuggerScope("local");
}

function getDebuggerGlobalScope(){
    getDebuggerScope("global");
}

function getWatchedVariables(){
    getDebuggerScope("watched");
}


// XXX: Actually bind this when rendering the box, we need to unbind it if we hid the box
$(document).bind("debugger-stopped", getDebuggerLocalScope);
$(document).bind("debugger-stopped", getDebuggerGlobalScope);
$(document).bind("debugger-stopped", getWatchedVariables);

function addVariableToWatch(variable){
    
    // We add the variable 
    
    jQuery.ajax({type: 'POST',
                 url: 'http://'+AUX_HOST+':'+AUX_PORT,
                 async : true,
                 data: {'command': 'add-watched-variable',
                        'variable': variable}
                });
    
    // And then we update the whole list.
    getWatchedVariables();
    
}

function addVariableToWatchFromInput(event){

    var key = event.which;
    if (key != 13){
        // If key was anything but ENTER, just return
        return;
    }
    
    // If ENTER was pressed, then get the variable and save it
    
    var variable = document.getElementById("watched-variables-input").value;
    
    addVariableToWatch(variable);
    
}

function addCodeLineToEditor(span){
    command = $(span).data('command');
    env.editor.insert(command);
}

function addWatchedVriableFromConsole(span){
    command = $(span).data('command');
    addVariableToWatch(command);
}

function runCodeInDebugger(event){
    var key = event.which;
    if (key != 13){
        // If key was anything but ENTER, just return
        return;
    }
    
    // If ENTER was pressed, then run the call
        
    var input = document.getElementById("debugger-console-input").value;
    jQuery.ajax({type: 'POST',
                 url: 'http://'+AUX_HOST+':'+AUX_PORT,
                 async : true,
                 data: {'command': 'eval-code',
                        'input': input},
                 success: function(results){
                        var table = $(".debugger-console-box > table");
                        
                        // The command that was issued
                        var tr_c = $('<tr></tr>');
                        tr_c.addClass("command-issued");
                        var td_c = $('<td></td>');
                        // Placeholder for actions
                        var actions = $('<div></div>');
                        actions.addClass("command-actions");
                        
                        var add_to_editor = $('<span></span>');
                        add_to_editor.data('command', input);
                        add_to_editor.click(function(){
                                                addCodeLineToEditor(this);
                                                        });
                        var img_add = $('<img></img>');
                        img_add.attr('src', 'data:image/gif;base64,R0lGODlhEAAQAIABADRrqf///yH5BAEKAAEALAAAAAAQABAAAAIhjI+pwK3Y3DORTVpX3TZwjn1RKHbl6J0dlF3blaLTC8MFADs='); // Plus symbol
                        img_add.attr('title', "Add command to editor");
                        add_to_editor.append(img_add);
                        
                        var add_to_watched_variables = $('<span></span>');
                        add_to_watched_variables.data('command', input);
                        add_to_watched_variables.click(function(){
                                                addWatchedVriableFromConsole(this);
                                                        });
                        var img_eye = $('<img></img>');
                        img_eye.attr('src', 'data:image/gif;base64,R0lGODlhEAAQAKEDAAAAAAcHB4qKiv///yH5BAEKAAMALAAAAAAQABAAAAIonI+py80A44NIHqskPQKKuh0BZoTGaA5kF3wXoKYvPIN0FsnOzvdDAQA7'); // Eye symbol
                        img_eye.attr('title', "Add as a watched variable");
                        add_to_watched_variables.append(img_eye);
                        
                        actions.append(add_to_editor);
                        actions.append(add_to_watched_variables);
                        
                        var command = $('<span></span>');
                        command.text(input);
                        td_c.append(actions);
                        td_c.append(command);
                        tr_c.append(td_c);
                        table.append(tr_c);
                        
                        // The returned value
                        var tr_r = $('<tr></tr>');
                        tr_r.addClass("returned-value");
                        var td_r = $('<td></td>');
                        var returned = $('<span></span>');
                        returned.text(results);
                        td_r.append(returned);
                        tr_r.append(td_r);
                        table.append(tr_r);
                           
                    }
                });
    document.getElementById("debugger-console-input").value = "";
}
//$(document).bind("debugger-step", getDebuggerLocalScope);
//$(document).bind("debugger-next", getDebuggerLocalScope);
//$(document).bind("debugger-continue", getDebuggerLocalScope);
//$(document).bind("debugger-return", getDebuggerLocalScope);
