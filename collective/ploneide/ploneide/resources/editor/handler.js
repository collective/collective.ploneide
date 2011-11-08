define(function(require, exports, module) {
    require("pilot/fixoldbrowsers");
    require("pilot/settings");
    var environment = require("pilot/environment");
    require('ace/theme/pastel_on_dark');
    require("ace");

    var catalog = require("pilot/plugin_manager").catalog;
    //var dojo = require('dojo');
    var Split = require("ace/split").Split;
    var plugins = [ "pilot/index"]; 
    var canon =  require("pilot/canon");
    var twilight = require("ace/theme/twilight");
    //var env = enviroment.create();    

var Handler = function() {
    this.container = document.getElementById('EditorContainer');
    this.canon = canon;
    this.env = environment.create();
    this.default_setup();
    
};

(function(){
    this.default_setup = function(){
        var split = this.create_split(twilight);
            
        var Python = require("ace/mode/python").Mode;
        var h = new Python();
        this.set_mode(h);
    };
    
    this.create_split = function(theme){
        var split = new Split(this.container, theme, 1);
        this.env.editor = split.getEditor(0);
        this.env.split = split;
        var self = this
        split.on("focus", function(editor) {
            self.env.split.resize();
        });
        this.env.split.resize();        
        
        return ;
    };
    
    this.set_mode = function(mode){
        session = this.env.editor.getSession()
        session.setMode(mode);
    };

}).call(Handler.prototype);

exports.Handler = Handler;
});

