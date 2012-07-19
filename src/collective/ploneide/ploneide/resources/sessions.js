
function markModified(){
    var tab_index = env.editor.getSession().tab_index;
    span = $('span.tab').get(tab_index);
    $(span).addClass('modified');
}

function unmarkModified(){
    var tab_index = env.editor.getSession().tab_index;
    span = $('span.tab').get(tab_index);
    $(span).removeClass('modified');
}

tabs_select = function(tab){
    $(tab).siblings('.tab').removeClass('selected');
    $(tab).addClass('selected');
};

function switchActiveSession(tab_index){
    var session = global_sessions[tab_index];

    env.editor.setSession(session);
    env.editor.focus();

    $(document).trigger("session-switched");

}

function switchSessionFromTab(span){
    var tab_index = $(span).data('index');

    switchActiveSession(tab_index);
}

function createTab(session){

    var span = $('<span></span>');
    span.addClass('tab');

    span.html(session.tab_id);
    span.data('index', session.tab_index);

    span.click(function(){
                tabs_select(this);
                switchSessionFromTab(this);
            });

    var span_close = $('<span class="close"></span>');

    span_close.html("X");
    span_close.data('index', session.tab_index);

    span_close.click(function(){
                closeSessionFromSpan(this);
            });

    span.append(span_close);

    return span;
}

function updateFilesTabs(){

    var div = $('#editor-files-tabs');

    div.html('');

    for (var index in global_sessions){
        var session = global_sessions[index];
        var tab = createTab(session);

        div.append(tab);
    }
}


function addSessionToTab(session){

    var div = $('#editor-files-tabs');
    var tab = createTab(session);
    div.append(tab);
    tabs_select(tab);

}

function purgeFilesTabs(){
    var div = $('#editor-files-tabs');

    div.html('');
}

function chooseSessionName(id){
    var new_name = id;
    var append_id = 1;

    var should_rename = false;

    do{
        should_rename = false;
        for (var index in global_sessions){
            if (global_sessions[index].tab_id == new_name){
                should_rename = true;
                break;
            }
        }
        if (should_rename){
            append_id++;
            new_name = id+' ('+append_id+')';
        }

    }while (should_rename);

    return new_name;

}

function createNewSession(data, mode, id, full_path){

    var length = global_sessions.length;
    var session = new EditSession(data);
    var name = chooseSessionName(id);

    session.setMode(mode);
    session.setUndoManager(new UndoManager());
    session.tab_id = name;
    session.tab_index = length;
    session.filename = full_path;

    session.on("change", function(editor){
        markModified();
    });

    global_sessions.push(session);

    storeCurrentSessionsGroup();

    addSessionToTab(session);
    switchActiveSession(session.tab_index);

    return session;

}

function createNewEmptySession(){

    var mode = getEditMode("text");

    var session = createNewSession("", mode, "Untitled", "");

    return session;

}

function checkFilenameInSessions(full_path){

    for (var index in global_sessions){
        if (global_sessions[index].filename == full_path){
            return index;
        }
    }

    return false;

}

function updateSessions(){

    for (var index in global_sessions){
        global_sessions[index].tab_index = index;
    }

}

function closeSession(tab_index){

    var current_session = env.editor.getSession();
    var current_tab_index = current_session.tab_index;

    global_sessions.splice(tab_index, 1);
    updateSessions();
    updateFilesTabs();

    if (tab_index < current_tab_index){
        // If i'm closing a tab that is behind the one i'm currently in
        current_tab_index--;
    }
    else if (current_tab_index == global_sessions.length){
        // If i'm closing the last tab and i'm currently in it
        current_tab_index--;
    }

    if (current_tab_index >= 0){
        switchActiveSession(current_tab_index);
    }
    else{
        createNewEmptySession();
    }

    storeCurrentSessionsGroup();
}

function closeSessionFromSpan(span){

    var tab_index = $(span).data('index');
    closeSession(tab_index);
}

function resetCurrentSessionsGroup(){
    global_sessions = [];
}

function renameCurrentSessionsGroup(new_name){
    // If we need to rename the session group, we need to do it in the storage
    // too
    var sessions = getSavedSessions();
    var storage = getSessionsDefaultStorage();

    var found = false;
    for (var index in sessions){
        if (new_name == sessions[index]){
            found = true;
            break;
        }
    }
    
    if (!found){
        if (storage == "localStorage"){
            var old_name = getCurrentSessionsGroupName();
            localStorageRenameSessionGroup(old_name, new_name);
        }
        
        setCurrentSessionsGroupName(new_name);
    }
    updateSessionGroupsList();
}

function setCurrentSessionsGroupName(name){
    current_sessions_group_name = name;
}


function getCurrentSessionsGroupName(){
    return current_sessions_group_name;
}

function createNewEmptySessionsGroup(){
    // We first need to reset the current sessions group
    purgeFilesTabs();
    resetCurrentSessionsGroup();
    setCurrentSessionsGroupName("Untitled");
    createNewEmptySession();
    updateSessionGroupsList();
}


function createSessionsGroup(){
    var auto_load_last_sessions_group = shouldLoadLastSessionsGroup();

    if (auto_load_last_sessions_group){
        var storage = getSessionsDefaultStorage();

        if (storage == "localStorage"){
            // We get the name of the last used sessions group
            var name = localStorageGetLastSessionGroupName();
            if (name){
                loadSessionsGroup(name);
            }
            else{
                createNewEmptySessionsGroup();
            }
        }
        else{
            createNewEmptySessionsGroup();
        }

    }
    else{
        createNewEmptySessionsGroup();
    }
}


function loadSessionsGroup(name){
    // We first need to reset the current sessions group
    purgeFilesTabs();
    resetCurrentSessionsGroup();

    // We get the default storage to be used
    var storage = getSessionsDefaultStorage();
    var files_to_open = [];

    if (storage == "localStorage"){
        // We get the sessions group
        files_to_open = localStorageRestoreSessionGroup(name);
    }

    if (files_to_open){
        // If we had files we need to open, we create the group with that
        // list
        setCurrentSessionsGroupName(name);
        loadFilesFromList(files_to_open);
    }
    else{
        // If not, we just create an empty group
        createNewEmptySessionsGroup();
    }
    
    updateSessionGroupsList();
}

function removeSessionsGroup(name){
    // We get the default storage to be used
    var storage = getSessionsDefaultStorage();

    if (storage == "localStorage"){
        localStoragePurgeSessionGroup(name);
    }
}

function storeCurrentSessionsGroup(){
    // We get the default storage to be used
    var storage = getSessionsDefaultStorage();
    var success = '';

    if (storage == "localStorage"){
        success = localStorageStoreCurrentSessionGroup();
    }

    return success;
}

function getSavedSessions(){
    // We get the default storage to be used
    var storage = getSessionsDefaultStorage();
    var sessions = [];

    if (storage == "localStorage"){
        sessions = localStorageGetAllSessionGroups();
    }
    
    return sessions;
    
}


function updateSessionGroupsList(){
    var sessions = getSavedSessions();

    var select = $('#sessions-group-list');
    select.html('');
    
    var current_name = getCurrentSessionsGroupName();
    
    for (var index in sessions){
        var option = $('<option></option>');
        option.val(sessions[index]);
        option.html(sessions[index]);
        if (current_name == sessions[index]){
            option.attr('selected', 'selected');
        }
        select.append(option);
    }
         
}
    
function setFontSize(){
    var size = document.getElementById("fontsize").value;
    
    env.editor.setFontSize(size);
}

function splitHorizontal(){
    splitSession("below");
}

function splitVertical(){
    splitSession("side");
}

function splitSession(value) {
    var sp = env.split;
    var alreadySplitted = (sp.getSplits() == 2);
    
    if (value == "below") {
        var orientation = sp.BELOW;
    } else if (value == "side") {
        var orientation = sp.BESIDE;
    }
    
    var sameOrientation = (sp.getOrientation() == orientation);
    
    if (alreadySplitted && sameOrientation){
        // Should close
        var session = sp.getCurrentEditor().session;
        sp.setSplits(1);
        sp.setSession(session, 0);
    }
    else if (!alreadySplitted) {
        sp.setOrientation(orientation);
        sp.setSplits(2);
        var session = sp.getEditor(0).session;
        var newSession = sp.setSession(session, 1);
        newSession.name = session.name;
    }
    else {
        sp.setOrientation(orientation);
    }
}
    
function shouldLoadLastSessionsGroup(){
    // Eventually this function will get an internal configuration state
    // to know if we should auto load last used sessions group on startup
    // for now, we just return true

    return true;
}

function getSessionsDefaultStorage(){
    // Eventually we might have more than one storage option. For now
    // we only return localStorage

    return "localStorage";
}

 
