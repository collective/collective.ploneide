
function singleLineEditor(el) {
    var renderer = new Renderer(el);
    renderer.scrollBar.element.style.display = "none";
    renderer.scrollBar.width = 0;
    renderer.content.style.height = "auto";

    renderer.screenToTextCoordinates = function(x, y) {
        var pos = this.pixelToScreenCoordinates(x, y);
        return this.session.screenToDocumentPosition(
            Math.min(this.session.getScreenLength() - 1, Math.max(pos.row, 0)),
            Math.max(pos.column, 0)
        );
    };
    // todo size change event
    renderer.$computeLayerConfig = function() {
        var longestLine = this.$getLongestLine();
        var firstRow = 0;
        var lastRow = this.session.getLength();
        var height = this.session.getScreenLength() * this.lineHeight;

        this.scrollTop = 0;
        var config = this.layerConfig;
        config.width = longestLine;
        config.padding = this.$padding;
        config.firstRow = 0;
        config.firstRowScreen = 0;
        config.lastRow = lastRow;
        config.lineHeight = this.lineHeight;
        config.characterWidth = this.characterWidth;
        config.minHeight = height;
        config.maxHeight = height;
        config.offset = 0;
        config.height = height;

        this.$gutterLayer.element.style.marginTop = 0 + "px";
        this.content.style.marginTop = 0 + "px";
        this.content.style.width = longestLine + 2 * this.$padding + "px";
        this.content.style.height = height + "px";
        this.scroller.style.height = height + "px";
        this.container.style.height = height + "px";
    };
    renderer.isScrollableBy=function(){return false};

    var editor = new Editor(renderer);
    new MultiSelect(editor);
    editor.session.setUndoManager(new UndoManager());

    editor.setHighlightActiveLine(false);
    editor.setShowPrintMargin(false);
    editor.renderer.setShowGutter(false);
    // editor.renderer.setHighlightGutterLine(false);
    return editor;
}

function startupPloneIDE() {
    // XXX: Need to find a way to clear the browser history at this point
    //      so there are no problems (e.g. trackpad gesture to go left in mac)
    env = {};

    dom = require("ace/lib/dom");
    net = require("ace/lib/net");

    event = require("ace/lib/event");
    EditSession = require("ace/edit_session").EditSession;
    UndoManager = require("ace/undomanager").UndoManager;

    vim = require("ace/keyboard/vim").handler;
    emacs = require("ace/keyboard/emacs").handler;
    HashHandler = require("ace/keyboard/hash_handler").HashHandler;

    Renderer = require("ace/virtual_renderer").VirtualRenderer;
    Editor = require("ace/editor").Editor;
    MultiSelect = require("ace/multi_select").MultiSelect;
    Range = require("ace/range").Range;
    JavaScriptMode = require("ace/mode/javascript").Mode;
    CssMode = require("ace/mode/css").Mode;
    HtmlMode = require("ace/mode/html").Mode;
    XmlMode = require("ace/mode/xml").Mode;
    PythonMode = require("ace/mode/python").Mode;
    
    
    var WorkerClient = require("ace/worker/worker_client").WorkerClient;
    PythonMode.prototype.createWorker = function(session) {
        var worker = new WorkerClient(["ace"], "python_worker", "Worker");
        worker.attachToDocument(session.getDocument());
        
        worker.on("python_static_check", function(e) {
            var errors = [];
            results = JSON.parse(e.data);
            pyflakes = results[0];
            pep8 = results[1];
            compile_errors = results[2];
            
            pep8.forEach(function(message) {
                errors.push({
                    row: message.line - 1,
                    column: message.col - 1,
                    text: message.message,
                    type: message.type,
                    lint: message
                });
            });
            pyflakes.forEach(function(message) {
                errors.push({
                    row: message.line - 1,
                    text: message.message,
                    type: message.type,
                    lint: message
                });
            });

            if (compile_errors != ""){
                $('span.tab.selected').addClass('compile-error');
            }
            else{
                $('span.tab.selected').removeClass('compile-error');
            }
            $('span.tab.selected').attr("title", compile_errors);   

            session.setAnnotations(errors);
        });
        return worker;
    };
    
    
    TextMode = require("ace/mode/text").Mode;
    theme = require("ace/theme/pastel_on_dark");

    var container = document.getElementById("editor");
    
    // Splitting.
    Split = require("ace/split").Split;
    var split = new Split(container, theme, 1);
    env.editor = split.getEditor(0);
    split.on("focus", function(editor) {
        env.editor = editor;
        // updateUIEditorOptions();
    });
    env.split = split;
    window.env = env;
    window.ace = env.editor;

    env.editor.setAnimatedScroll(false);

    env.editor.getSession().setMode(new PythonMode());

    // XXX: Make the console to work
    var consoleEl = dom.createElement("div");
    container.parentNode.appendChild(consoleEl);
    // $('body').append(consoleEl);
    consoleEl.style.position="relative"
    // consoleEl.style.bottom = "1px"
    consoleEl.style.left = 0
    consoleEl.style.background = "white"
    consoleEl.style.border = "1px solid #baf"
    consoleEl.style.zIndex = "100"
    var cmdLine = new singleLineEditor(consoleEl);
    cmdLine.editor = env.editor;
    env.editor.cmdLine = cmdLine;

    // Save shortcut, works from the editor and the command line.
    env.editor.commands.addCommands([{
        name: "save",
        bindKey: {
            win: "Ctrl-S",
            mac: "Command-S",
            sender: "editor|cli"
        },
        exec: function() {
            saveCurrentFile();
        }
    },
    {
        name: "toggleComments",
        bindKey: {
            win: "Ctrl-D",
            mac: "Command-D",
            sender: "editor|cli"
        },
        exec: function() {
            env.editor.toggleCommentLines();
        }
    },
    {
        name: "getCodeDefinition",
        bindKey: {
            win: "Ctrl-G",
            mac: "Command-G",
            sender: "editor|cli"
        },
        exec: function() {
            getCodeDefinition();
        }
    },
    {
        name: "focusCommandLine",
        bindKey: "shift-esc",
        exec: function(editor, needle) { editor.cmdLine.focus(); },
        readOnly: true
    }]);

    cmdLine.commands.bindKeys({
        "Shift-Return|Ctrl-Return|Alt-Return": function(cmdLine) { cmdLine.insert("\n")},
        "Esc|Shift-Esc": function(cmdLine){ cmdLine.session.setValue(''); cmdLine.editor.focus(); },
        "Return": function(cmdLine){
            var command = cmdLine.getValue().split(/\s+/);
            var editor = cmdLine.editor;
            editor.commands.exec(command[0], editor, command[1]);
            cmdLine.session.setValue('');
            editor.focus();
        },
    })
    // add multiple cursor support to editor
    require("ace/multi_select").MultiSelect(env.editor);

    var height = $('#editor-main').height() - 100;
    $('#editor').height(height);

    createDialogForID('a#manage-sessions');
    createDialogForID('a#save-as');
    createDialogForID('a#context-info');
    createDialogForID('a#plone-reload');
    createSnippetsDialog('a#code-snippets');
    checkPloneRunning();

    $('.ace_gutter-cell').live("click", addRemoveBreakpoint);

    global_sessions = [];

    getSavedBreakpoints();
    // We create the sessions group.
    createSessionsGroup();
    getDeveloperManualLink();
    resizeEditorSection();

}


define(function(require, exports, module) {
    "use strict";

    require("ace/lib/fixoldbrowsers");
    require("ace/config").init();

    require(["ace/ace", "ace/keyboard/vim", "ace/keyboard/emacs",
             "ace/mode/javascript", "ace/mode/css", "ace/mode/html",
             "ace/mode/xml", "ace/mode/python", "ace/mode/text", 
             "ace/theme/pastel_on_dark", "ace/split", "ace/worker/worker_client"], function(util) {
        startupPloneIDE();
    });


});
