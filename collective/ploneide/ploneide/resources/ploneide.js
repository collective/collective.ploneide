function createPloneIDE(env){

    EditSession = require("ace/edit_session").EditSession;
    UndoManager = require("ace/undomanager").UndoManager;
    Range = require("ace/range").Range;
    JavaScriptMode = require("ace/mode/javascript").Mode;
    CssMode = require("ace/mode/css").Mode;
    HtmlMode = require("ace/mode/html").Mode;
    XmlMode = require("ace/mode/xml").Mode;
    PythonMode = require("ace/mode/python").Mode;
    TextMode = require("ace/mode/text").Mode;
    theme = require("ace/theme/pastel_on_dark");

    var canon = require("pilot/canon");

    var container = document.getElementById("editor");
    var cockpitInput = document.getElementById("cockpitInput");

    // Splitting.
    var Split = require("ace/split").Split;
    var split = new Split(container, theme, 1);
    env.editor = split.getEditor(0);
    split.on("focus", function(editor) {
        env.editor = editor;
//        updateUIEditorOptions();
    });

    env.split = split;
    window.env = env;
    window.ace = env.editor;

    env.editor.getSession().setMode(new PythonMode());


    global_sessions = [];

    // Save shortcut, works from the editor and the command line.
    canon.addCommand({
        name: "save",
        bindKey: {
            win: "Ctrl-S",
            mac: "Command-S",
            sender: "editor|cli"
        },
        exec: function() {
            saveCurrentFile();
        }
    });


    // Toggle comments shortcut, works from the editor and the command line.
    canon.addCommand({
        name: "toggleComments",
        bindKey: {
            win: "Ctrl-D",
            mac: "Command-D",
            sender: "editor|cli"
        },
        exec: function() {
            env.editor.toggleCommentLines();
        }
    });

    // We create the sessions group.
    createSessionsGroup();

};

function checkPloneRunning(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'check-plone-instance-running'},
            async : true,
            success: function(results){
                    if (results != "False" && results != ""){
                        $("#current-plone-status > p > img#plone-up").css("display", "inline");
                        $("#current-plone-status > p > img#plone-down").css("display", "none");
                        $("img#plone-loading").css("display", "none");
                        setTimeout(checkPloneRunning, 1000);
                    }
                    else{
                        $("#current-plone-status > p > img#plone-down").css("display", "inline");
                        $("#current-plone-status > p > img#plone-up").css("display", "none");
                        setTimeout(checkPloneRunning, 1000);
                    }

                }
        });

}

function startPlone(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    var debugger_checkbox = $("#debugger-checkbox:checked");
    var sauna_checkbox = $("#use-sauna-reload:checked");

    if (debugger_checkbox.val()){
        debugger_checkbox = true;
    }
    else{
        debugger_checkbox = false;
    }

    if (sauna_checkbox.val()){
        sauna_checkbox = true;
    }
    else{
        sauna_checkbox = false;
    }
    $("img#plone-loading").css("display", "inline");
    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'start-plone-instance',
                   'sauna': sauna_checkbox,
                   'debugger': debugger_checkbox
                    },
            async : true,
            success: function(results){
                    // XXX: Do we need to do something ?
                }
        });

}

function stopPlone(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'kill-plone-instance'},
            async : true,
            success: function(results){
                    // XXX: Do we need to do something ?
                }
        });

}

function updateConsoleOutput(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'get-console-output'},
            async : true,
            dataType : "html",
            success: function(results){
                    if (document.getElementById("console-output") !== null){
                        $("div#console-output").replaceWith(results);
                        setTimeout(updateConsoleOutput, 1000);
                    }
                    }

        });

}

function renderConsoleOutput(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'get-console-output'},
            async : true,
            dataType : "html",
            success: function(results){
                    createDialogForContent('Contole Output', results);
                    updateConsoleOutput();
                }
        });
}