
window.onload = function() {

    String.prototype.endsWith = function(str) 
        {return (this.match(str+"$")==str)}

    // First thing first, let's load info for instance, ide and debug servers
    getServersInfo();
    
    //loading ide base        
    $.ajax({
      url: 'idebase.html',
      async: false,
      success: function(data) {
        $('body').prepend(data);
        //setup
        treeSetup();
        panelsSetup();
      }
    });


    /*XXX THIS SHOULD BE IN A MODULEEEEE*/
    /*var panel_action_buttons = '<div class="button-project-tree"></div><div class="button-pin"></div>'*/
    var t = $('body').layout({
        east__minSize:250,
        east__spacing_open:10,
        east__spacing_closed:15,
        south__spacing_open:15,
        south__spacing_closed:15,
        south__initClosed:	true,
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

    createDialogForSessions();
    $('a#save-as').prepOverlay(
            {
                subtype: 'ajax'
            }
        );
   
    $('a#context-info').prepOverlay(
            {
                subtype: 'ajax'
            }
        );
        
    $('a#plone-reload').prepOverlay(
            {
                subtype: 'ajax',
                formselector: 'form[name="reload-form"]',
                noform: 'reload'
            }
        );        
        
        

    var deps = [ "pilot/fixoldbrowsers", "pilot/plugin_manager", "pilot/settings",
                 "pilot/environment"];
    
    var plugins = [ "pilot/index", "cockpit/index"];
    require(deps, function() {
        var catalog = require("pilot/plugin_manager").catalog;
        catalog.registerPlugins(plugins).then(function() {
            var env = require("pilot/environment").create();
            catalog.startupPlugins({ env: env }).then(function() {
                createPloneIDE(env);
            });
        });
    });
    
    $('.ace_gutter-cell').live("click", addRemoveBreakpoint);
    
};
