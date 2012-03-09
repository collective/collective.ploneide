
function getServersInfo(){
    var url = location.href;
    $.ajax({
            url: url,
            async: false,
            data: {'command': 'get-servers-info'},
            success: function(results){
                var server_info = JSON.parse(results);
                window.$DEBUG_HOST = server_info['debug_host'];
                window.$DEBUG_PORT = server_info['debug_port'];
                window.$INSTANCE_HOST = server_info['instance_host'];
                window.$INSTANCE_PORT = server_info['instance_port'];
                window.$PLONEIDE_HOST = server_info['ploneide_host'];
                window.$PLONEIDE_PORT = server_info['ploneide_port'];
            }
    });
}

function getEditMode(mode) {
    var modes = {
        text: new TextMode(),
        javascript: new JavaScriptMode(),
        xml: new XmlMode(),
        html: new HtmlMode(),
        css: new CssMode(),
        python: new PythonMode()
    };

    return modes[mode];
}

function getDirectoryContents() {
    var directory = document.getElementById('directory').value;
    $('#folder-contents').load('@@list-directory?directory='+directory+'&ajax_load=1 #results option');
}

function changeSyntax(){
    var syntax = document.getElementById('syntax').value;

    var mode = getEditMode(syntax);

    env.editor.getSession().setMode(mode);
    env.editor.focus();
}

function loadTreeView(){
    var directory = document.getElementById('project-eggs').value;
    $('#directory').val(directory);
    $('#directory-area').load('@@list-directory?directory='+directory+'&ajax_load=1 #results option');
}

function updateTreeView(){
    var directory = document.getElementById('directory').value;
    var new_dir = document.getElementById('directory-area').value;

    jQuery.get('@@test-dir',
                {'directory':directory,
                 'new_dir':new_dir
                },
                function(results){
                    if (results){
                        $('#directory').val(results);
                        $('#directory-area').load('@@list-directory?directory='+results+'&ajax_load=1 #results option');
                    }
                    else{
                        loadFileInEditor(new_dir);
                    }
                });

}

function treeSetup() {

    // This will populate several file trees (will be able to configure it
    // from the buildout ploneide recipe, which folders to list under which
    // group. For now, we will just settle with "src"

    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    $.ajax({url: url,
            async: false,
            data: {'command': 'get-directory-content-ajax',
                   'initial': true},
            success: function(results){
                $.each(JSON.parse(results), function (index, entry){
                    var a = $('<a href="#"></a>');
                    var li = $('<li></li>');
                    var ul = $('<ul></ul>');
                    a.attr('class', entry['metatype']);
                    a.attr('rel', entry['rel']);
                    a.text(entry['title']);

                    li.append(a);
                    if (entry['metatype'] == "folder"){
                        li.append(ul);
                    }

                    $('.ultree').append(li);
                });
            }
    });

    $('.ultree').simplejqtree({
        'ajax_handler':{
            'url': url,
            'data': function(n){
                                return { command : 'get-directory-content-ajax',
                                         directory : n.attr ? n.attr("rel") : '' };
            }
        },
        'action_handler':function(item) {
            loadFileFromFullPath(item.attr('rel'));
        }
    });
}

function panelsSetup() {
    //$("ul.panel-tabs").tabs("div.panels > div", {'effect':'fade'});
    $("#right-panel-tabs").tabs({ selected: 0,
                                  opacity: 'toggle'});
}


function createDialogForID(id){
    $(id).click(function() {
        var url = this.href;
        var title = this.title;
        // show a spinner or something via css
        var dialog = $('<div style="display:none" class="loading" title="'+title+'"></div>').appendTo('body');
        // open the dialog
        dialog.dialog({
            // add a close listener to prevent adding multiple divs to the document
            close: function(event, ui) {
                // remove div with all data and events
                dialog.remove();
            },
            modal: true
        });

//      load remote content
        $.ajax({
            url: url,
            async: true,
            success: function(results){
                dialog.removeClass('loading');
                dialog.html(results);
            }
        });
        //prevent the browser to follow the link
        return false;
    });
}

function createDialogForContent(title, content){
    // show a spinner or something via css
    var dialog = $('<div style="display:none" class="loading" title="'+title+'"></div>').appendTo('body');
    
    dialog.removeClass('loading');
    dialog.html(content);
    // open the dialog
    dialog.dialog({
        // add a close listener to prevent adding multiple divs to the document
        close: function(event, ui) {
            // remove div with all data and events
            dialog.remove();
        },
        modal: true,
        width: window.innerWidth - 200,
        height: window.innerHeight - 200
        
    });
}
