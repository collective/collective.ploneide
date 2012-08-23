
function debuggerStep() {

    jQuery.post('http://'+DEBUGGER_HOST+':'+DEBUGGER_PORT,
                {'command':'step'
                 },
                function(results){
                    $(document).trigger("debugger-step");
                });

}


function debuggerNext() {

    jQuery.post('http://'+DEBUGGER_HOST+':'+DEBUGGER_PORT,
                {'command':'next'
                 },
                function(results){
                    $(document).trigger("debugger-next");
                });

}

function debuggerContinue() {

    jQuery.post('http://'+DEBUGGER_HOST+':'+DEBUGGER_PORT,
                {'command':'continue'
                 },
                function(results){
                    $(document).trigger("debugger-continue");
                });

}

function debuggerReturn() {

    jQuery.post('http://'+DEBUGGER_HOST+':'+DEBUGGER_PORT,
                {'command':'return'
                 },
                function(results){
                    $(document).trigger("debugger-return");
                });

}

function addBreakpointsForFile(){
    var filename = env.editor.session.filename;
    var file_bkpt = env.$breakpoints[filename];
    if (file_bkpt === undefined){
        file_bkpt = {};
    }

    for (lineno in file_bkpt){
        env.editor.session.setBreakpoint(lineno-1);
    }
}

$(document).bind("file-opened", addBreakpointsForFile);

function addBreakpoint($this) {
    var lineno = $this.text();
    var filename = env.editor.session.filename;

    // This wil *only* work for python files
    var mode = getFileType(filename);
    if (mode != "python"){
        return;
    }

    var line = env.editor.session.getLine(lineno-1).trim();

    if (line.startsWith("#") || line === ""){
        // If this is a blank line or a comment, we won't place a breakpoint
        // Have to figure our a way to tell if the current line belongs to a
        // docstring or not
        return
    }

    var file_bkpt = env.$breakpoints[filename];
    if (file_bkpt === undefined){
        file_bkpt = {};
    }

    var line_bkpt = file_bkpt[lineno];
    if (line_bkpt === undefined){
        file_bkpt[lineno] = {'condition':''};
        env.$breakpoints[filename] = file_bkpt;
    }

    env.editor.session.setBreakpoint(lineno-1);

    $(document).trigger("breakpoint-set");

    // Now that our breakpoint is set, let's notify the server if it is running

    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    jQuery.post(url,
                {'command':'add-breakpoint',
                 'line':lineno,
                 'filename':env.editor.session.filename
                 },
                function(results){
                    // We don't care about the result value anymore.
                });

}

function removeBreakpoint($this) {
    var lineno = $this.text();
    var filename = env.editor.session.filename;

    var file_bkpt = env.$breakpoints[filename];
    if (file_bkpt === undefined){
        // This shouldn't happen, we didn't even had breakpoints for the
        // file :-/
        file_bkpt = {};
    }

    delete file_bkpt[lineno];

    env.$breakpoints[filename] = file_bkpt;

    if (isEmpty(file_bkpt)){
        delete env.$breakpoints[filename];
    }

    env.editor.session.clearBreakpoint(lineno-1);

    $(document).trigger("breakpoint-unset");
    // Now that our breakpoint was removed, let's notify the server if it
    // is running


    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    jQuery.post(url,
                {'command':'remove-breakpoint',
                 'line':lineno,
                 'filename':env.editor.session.filename
                 },
                function(results){
                    // We don't care about the result value anymore.
                });

}

function addRemoveBreakpoint(){
//     $('.ace_gutter-cell').toggle(function(){$this = $(this); line_number = $this.html(); })

    if ($(this).hasClass("ace_breakpoint")){
        removeBreakpoint($(this));
    }
    else{
        addBreakpoint($(this));
    }

//     breakpoints = env.editor.session.getBreakpoints();

}

function removeCurrentLinePositionMarker(){
    if (env.editor.session.$debugger_current_line_marker !== undefined){
        env.editor.session.removeMarker(env.editor.session.$debugger_current_line_marker);
    }
}

$(document).bind("debugger-step", removeCurrentLinePositionMarker);
$(document).bind("debugger-next", removeCurrentLinePositionMarker);
$(document).bind("debugger-continue", removeCurrentLinePositionMarker);
$(document).bind("debugger-return", removeCurrentLinePositionMarker);

function getDebuggerStatus(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    var res = jQuery.ajax({type: 'POST',
                            url: url,
                            async : false,
                            data: {'command': 'is-stopped'},
                            success: function(results){
                                        if (results != "False" && results != ""){
                                            var split = results.split(":");
                                            var full_path = split[0];
                                            var lineno = split[1];
                                            loadFileFromFullPath(full_path);
                                            env.editor.scrollToLine(lineno, true);
                                            addBreakpointsForFile();
                                            var range = new Range(lineno -1, 0, lineno*1, 0); // Adding *1 to the string will cast it to int (???????)
                                            env.editor.session.$debugger_current_line_marker = env.editor.session.addMarker(range, "debugger_current_line", "line");
                                        }

                                        }
                            });

    return res;
}


function checkDebuggerStopped(){
    // XXX: Reimplement this with socket.io
    var res = getDebuggerStatus();
    if (res.response == "False" || res.response == "" || res.response === undefined){
        // Hide controls
        $(".debugger-controls").css('display','none');
        $('#debugger-console').css('display','none');
        var height = $('#editor-main').height() - 75;
        $('#editor').height(height);
        env.split.resize();
        var debugger_checkbox = $("#debugger-checkbox:checked");
        if (debugger_checkbox.val() !== undefined){
            setTimeout(checkDebuggerStopped, 500);
        }
    }
    else{
        $(document).trigger("debugger-stopped");
        // Show controls
        $(".debugger-controls").css('display','block');
        $('#debugger-console').css('display','block');
        var height = $('#editor-main').height() - 75;
        $('#debugger-console').height(height * 0.3);
        $('#editor').height(height * 0.7);
        env.split.resize();
    }
}

$(document).bind("debugger-step", checkDebuggerStopped);
$(document).bind("debugger-next", checkDebuggerStopped);
$(document).bind("debugger-continue", checkDebuggerStopped);
$(document).bind("debugger-return", checkDebuggerStopped);

function enableDebugging(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    $.ajax({
            url: url,
            async: true,
            data: {'command':'start-debugging'},
            success: function(results){
                checkDebuggerStopped();
            }
            });


}

function disableDebugging(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    $.ajax({
            url: url,
            async: true,
            data: {'command':'stop-debugging'}
            });

}

function toggleDebugging(){
    var debugger_checkbox = $("#debugger-checkbox:checked");
    if (debugger_checkbox.val() !== undefined){
        enableDebugging();
    }
    else{
        disableDebugging();
    }

}

function getBreakpointsDefaultStorage(){
    // Eventually we might have more than one storage option. For now
    // we only return localStorage

    return "localStorage";
}

function getSavedBreakpoints(){
    // We get the default storage to be used
    var storage = getBreakpointsDefaultStorage();

    if (storage == "localStorage"){
        localStorageLoadBreakpoints();
    }

}

function saveBreakpoints(){
    // We get the default storage to be used
    var storage = getBreakpointsDefaultStorage();

    if (storage == "localStorage"){
        localStorageSaveBreakpoints();
    }

}

$(document).bind("breakpoint-set", saveBreakpoints);
$(document).bind("breakpoint-unset", saveBreakpoints);

