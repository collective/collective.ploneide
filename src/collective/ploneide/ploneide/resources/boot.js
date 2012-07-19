
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

    var consoleEl = dom.createElement("div");
    container.parentNode.appendChild(consoleEl);
    consoleEl.style.position="fixed"
    consoleEl.style.bottom = "1px"
    consoleEl.style.right = 0
    consoleEl.style.background = "white"
    consoleEl.style.border = "1px solid #baf"
    consoleEl.style.zIndex = "100"
    var cmdLine = new singleLineEditor(consoleEl);
    cmdLine.editor = env.editor;
    env.editor.cmdLine = cmdLine;

    // Save shortcut, works from the editor and the command line.
    env.editor.commands.addCommand({
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
    env.editor.commands.addCommand({
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

    // add multiple cursor support to editor
    require("ace/multi_select").MultiSelect(env.editor);

    /*XXX THIS SHOULD BE IN A MODULEEEEE*/
    /*var panel_action_buttons = '<div class="button-project-tree"></div><div class="button-pin"></div>'*/
    var t = $('body').layout({
        east__minSize:280,
        east__spacing_open:10,
        east__spacing_closed:15,
        south__spacing_open:15,
        south__spacing_closed:15,
        south__initClosed:  true,
        onresize_end: function () {
            /* XXX: Need to calculate this more dynamically */
            var height = $('#editor-main').height() - 75;
            if ($('#debugger-console').css('display') != "none"){
                $('#debugger-console').height(height * 0.3);
                $('#editor').height(height * 0.7);
            }
            else{
                $('#editor').height(height);
            }
            env.split.resize();
        }
    });

    var height = $('#editor-main').height() - 100;
    $('#editor').height(height);

    createDialogForID('a#manage-sessions');
    createDialogForID('a#save-as');
    createDialogForID('a#context-info');
    createDialogForID('a#plone-reload');
    checkPloneRunning();

    $('.ace_gutter-cell').live("click", addRemoveBreakpoint);

    getSavedBreakpoints();
    // We create the sessions group.
    createSessionsGroup();
    getDeveloperManualLink();
}

global_sessions = [];

define(function(require, exports, module) {
    "use strict";

    require("ace/lib/fixoldbrowsers");
    require("ace/config").init();

    require(["ace/ace", "ace/keyboard/vim", "ace/keyboard/emacs",
             "ace/mode/javascript", "ace/mode/css", "ace/mode/html",
             "ace/mode/xml", "ace/mode/python", "ace/mode/text", 
             "ace/theme/pastel_on_dark", "ace/split"], function(util) {
        startupPloneIDE();
    });


});
