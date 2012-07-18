
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
    $('.ultree').simplejqtree({
        'ajax_handler':{
            'url': '@@directory-content-ajax',
            'data': function(n){
                                return { directory : n.attr ? n.attr("rel") : '' };
            }
        },
        'action_handler':function(item) {
            loadFileFromFullPath(item.attr('rel'));
        }
    }); 
}

function panelsSetup() {
    $("ul.panel-tabs").tabs("div.panels > div", {'effect':'fade'});
}
