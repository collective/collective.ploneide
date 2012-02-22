
function getEditModeFromFilename(file_name) {

    var mode = "text";
    if (/^.*\.js$/i.test(file_name)) {
        mode = "javascript";
    } else if (/^.*\.xml$/i.test(file_name)) {
        mode = "xml";
    } else if (/^.*\.zcml$/i.test(file_name)) {
        mode = "xml";
    }  else if (/^.*\.html$/i.test(file_name)) {
        mode = "html";
    } else if (/^.*\.pt$/i.test(file_name)) {
        mode = "html";
    } else if (/^.*\.css$/i.test(file_name)) {
        mode = "css";
    } else if (/^.*\.py$/i.test(file_name)) {
        mode = "python";
    }

    return getEditMode(mode);

}

function loadFileFromFullPath(full_path){

        //We first need to check that we didn't open already this same file
    var tab_index = checkFilenameInSessions(full_path);

    if (tab_index){
        // if we already opened it, we switch to it
        switchActiveSession(tab_index);
    }
    else{

        var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
        var split = full_path.split("/");
        var directory = split.slice(0,-1).join("/");
        var file_name = split.slice(-1).pop();

        // If not, we open it
        jQuery.ajax({type: 'POST',
                     url: url,
                     async : false,
                     data: {'command': 'open-file',
                            'directory':directory,
                            'file_name':file_name},
                     success: function(results){
                            var mode = getEditModeFromFilename(file_name);

                            var session = createNewSession(results, mode, file_name, full_path);
                            $(document).trigger("file-opened");

                                }
                    });
        
    }
}

function loadFileInEditor(file_name){
    var directory = document.getElementById('directory').value;

    if (directory.slice(-1) == '/'){
        directory = directory.slice(0, -1);
    }

    var full_path = directory+'/'+file_name;

    loadFileFromFullPath(full_path);
}


function saveCurrentFile(){

    var session = env.editor.getSession();
    
    if (session.filename !== ""){
        var split = session.filename.split("/");
        var directory = split.slice(0,-1).join("/");
        var file_name = split.slice(-1).pop();
    
        var content = session.getValue();

        var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    
        jQuery.post(url,
                    {'command':'save-file',
                     'directory':directory,
                     'file_name':file_name,
                     'content':content
                    },
                    function(results){
    //                 alert(results);
                    });
    }
    else{
        // If we are here, means we are trying to save a new Session, which
        // has no file name nor directory. We should call the "Save As" dialog
    }
}


function saveFileAs(directory, filename){

    var session = env.editor.getSession();
    
    var content = session.getValue();

    var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    jQuery.post(url,
                {'command':'save-file',
                 'file_name':filename,
                 'content':content
                },
                function(results){
                    var name = chooseSessionName(filename);
                    var mode = getEditModeFromFilename(filename);
                    session.filename = results;
                    session.setMode(mode);
                    session.tab_id = name;
                    
                    storeCurrentSessionsGroup();
                    
                    updateFilesTabs();
                });
}


function loadFilesFromList(files_to_open){
    
    for (var index in files_to_open){
        var full_path = files_to_open[index];

        if (full_path == ""){
            createNewEmptySession();
        }
        else{
            loadFileFromFullPath(full_path);
        }
    }
}
        
