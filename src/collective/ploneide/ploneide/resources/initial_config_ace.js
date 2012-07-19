
define(function(require, exports, module) {
    "use strict";

    require("ace/lib/fixoldbrowsers");
    require("ace/config").init();
    var env = {};

    var dom = require("ace/lib/dom");
    var net = require("ace/lib/net");

    var event = require("ace/lib/event");
    var EditSession = require("ace/edit_session").EditSession;
    var UndoManager = require("ace/undomanager").UndoManager;

    var vim = require("ace/keyboard/vim").handler;
    var emacs = require("ace/keyboard/emacs").handler;
    var HashHandler = require("ace/keyboard/hash_handler").HashHandler;

    var Renderer = require("ace/virtual_renderer").VirtualRenderer;
    var Editor = require("ace/editor").Editor;
    var MultiSelect = require("ace/multi_select").MultiSelect;
    var Range = require("ace/range").Range;
    var JavaScriptMode = require("ace/mode/javascript").Mode;
    var CssMode = require("ace/mode/css").Mode;
    var HtmlMode = require("ace/mode/html").Mode;
    var XmlMode = require("ace/mode/xml").Mode;
    var PythonMode = require("ace/mode/python").Mode;
    var TextMode = require("ace/mode/text").Mode;
    var theme = require("ace/theme/pastel_on_dark");

    var container = document.getElementById("editor");
    
    // Splitting.
    var Split = require("ace/split").Split;
    var split = new Split(container, theme, 1);
    env.editor = split.getEditor(0);
    split.on("focus", function(editor) {
        env.editor = editor;
        // updateUIEditorOptions();
    });
    env.split = split;
    window.env = env;
    window.ace = env.editor;

    env.editor.setAnimatedScroll(true);

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

});

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
