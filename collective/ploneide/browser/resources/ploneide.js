function createPloneIDE(env){
    
    Editor = require("ace/editor").Editor;
    EditSession = require("ace/edit_session").EditSession;
    UndoManager = require("ace/undomanager").UndoManager;
    Range = require("ace/range").Range;
    /*JavaScriptMode = require("ace/mode/javascript").Mode;
    CssMode = require("ace/mode/css").Mode;
    HtmlMode = require("ace/mode/html").Mode;
    XmlMode = require("ace/mode/xml").Mode;
    PythonMode = require("ace/mode/python").Mode;
    TextMode = require("ace/mode/text").Mode;
    theme = require("ace/theme/pastel_on_dark");*/
    
    var canon = require("pilot/canon");

    var container = document.getElementById("editor");
    //var cockpitInput = document.getElementById("cockpitInput");

    // Splitting.
    var Split = require("ace/split").Split;
    var split = new Split(container, 'twilight', 1);
    env.editor = split.getEditor(0);
    split.on("focus", function(editor) {
        env.editor = editor;
//        updateUIEditorOptions();
    });
    
    env.split = split;
    window.env = env;
    window.ace = env.editor;
    
    env.editor.getSession().setMode('python');


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
    
