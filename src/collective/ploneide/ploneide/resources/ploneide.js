 function resizeEditorSection(){
    var consoleEl = $('div.ace_editor.ace-tm').get(0);

    var height = $('#editor-main').height() - 92;
    var width = $('#editor-main').width();

    if ($('#debugger-console').css('display') != "none"){
        $('#debugger-console').height(height * 0.3);
        $('#editor').height(height * 0.7);
    }
    else{
        $('#editor').height(height);
    }

    env.split.resize();
    consoleEl.style.width = width + "px";
    env.editor.cmdLine.resize()
}

function checkPloneRunning(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    setTimeout(checkPloneRunning, 1000);
    
    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'check-plone-instance-running'},
            async : true,
            success: function(results){
                    if (results != "False" && results != ""){
                        $("#current-plone-status > p > img#plone-up").css("display", "inline");
                        $("#current-plone-status > p > img#plone-down").css("display", "none");
                        $("img#plone-loading").css("display", "none");
                        $("#start-plone").attr('disabled', true);
                        $("#restart-plone").attr('disabled', false);
                        $("#stop-plone").attr('disabled', false);
                        $("#debugger-checkbox").attr('disabled', false);
                    }
                    else{
                        $("#current-plone-status > p > img#plone-down").css("display", "inline");
                        $("#current-plone-status > p > img#plone-up").css("display", "none");
                        $("#start-plone").attr('disabled', false);
                        $("#restart-plone").attr('disabled', true);
                        $("#stop-plone").attr('disabled', true);
                        $("#debugger-checkbox").attr('disabled', true);
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
                        if ($("div#console-output").html() != $(results).html()){
                            $("div#console-output").replaceWith(results);
                        }

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

function getDeveloperManualLink(){
    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;

    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'get-developer-manual-location'},
            async : true,
            dataType : "text",
            success: function(results){
                    if (results.startsWith('http://')){
                        $("#developermanual").attr('href', results+"/index.html");
                    }
                    else{
                        $("#developermanual").attr('href', "/developermanual/index.html");
                    }
                }
        });
}
