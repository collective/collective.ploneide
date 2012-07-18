
function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

function localStorageStoreCurrentSessionGroup(){

    // We check if local storage is supported
    if (!supports_html5_storage()){
        return false;
    }

    // We get the name for the current session
    var name = getCurrentSessionsGroupName();

    // We are going to have this as a global flag to know we have at least
    // one session in the storage
    localStorage["ploneide.sessions"] = true;

    // We will look in the list of sessions to know if we keep record of this
    // session already
    var found = false;
    var i = 0;
    while (localStorage["ploneide.sessions.names."+i] != null){
        if (localStorage["ploneide.sessions.names."+i] == name){
            found = true;
            break;
        }
        i++;
    }

    // If we didn't, then we'll add it
    if (!found){
        localStorage["ploneide.sessions.names."+i] = name;
    }

    // We set the "last used session"
    localStorage["ploneide.sessions.last"] = name;

    // We store all paths for this session
    for (var index in global_sessions){
        var filename = global_sessions[index].filename;
        if (filename === "undefined"){
            filename = "";
        }

        localStorage["ploneide.session."+name+"."+index] = filename;
    }

    // We need to remove the exceeding sessions that may have been stored
    // before
    index++;
    while (localStorage["ploneide.session."+name+"."+index] != null){
        localStorage.removeItem("ploneide.session."+name+"."+index);
        index++;
    }

    return true;
}

function localStorageRestoreLastSessionGroup(){
    if (!supports_html5_storage()){
        return false;
    }

    // we first check our flag to know if there's record of any session at all
    if (localStorage["ploneide.sessions"]){
        // We query for the name of the last session used
        var name = localStorage["ploneide.sessions.last"];

        // And we get the data for it
        var sessions_to_restore = localStorageRestoreSession(name);

        // Finally we return the data
        return sessions_to_restore;
    }

    return false;
}

function localStorageRestoreSessionGroup(name){
    if (!supports_html5_storage()){
        return false;
    }

    // We check that there's at least one path stored for this session
    if (localStorage["ploneide.session."+name+".0"] != null){

        var sessions_to_restore = [];

        // We iterate over all stored values
        var i = 0;
        while (localStorage["ploneide.session."+name+"."+i] != null){
            sessions_to_restore.push(localStorage["ploneide.session."+name+"."+i]);
            i++;
        }

        // Finally we return them
        return sessions_to_restore;

    }

    return false;
}

function localStoragePurgeSessionGroup(name){
    if (!supports_html5_storage()){
        return false;
    }

    // First we are going to remove all stored sessions under this name
    var i = 0;
    while (localStorage["ploneide.session."+name+"."+i] != null){
        localStorage.removeItem("ploneide.session."+name+"."+i);
        i++;
    }

    // Now we need to remove the name from the list of available sessions
    i = 0;
    var removed = false;
    while (localStorage["ploneide.sessions.names."+i] != null){
        if (removed){
            // If it was removed, then i need to move this session to the
            // previous one
            var prev_name = localStorage["ploneide.sessions.names."+i];
            
            localStorage["ploneide.sessions.names."+(i-1)] = prev_name;
        
        }
        else{
            // If it wasn't yet, i need to know if this is the one
            if (localStorage["ploneide.sessions.names."+i] == name){
                // This is the session i'm removing
                localStorage.removeItem("ploneide.sessions.names."+i);
                removed = true;
            }
        }
        i++;
    }

    if (removed && i > 1){
        // I need to remove the last entry
        localStorage.removeItem("ploneide.sessions.names."+(i-1));
    }
    
    if (i == 1){
        // If this session was the only one stored, we need to remove the
        // global flag
        localStorage.removeItem("ploneide.sessions");
    }
    else{
        if (localStorage["ploneide.sessions.last"] == name){
            // If the session i'm removing is the one i'm currently using
            // we need to set it to some other value.
            // We just set it to the first session, to be sure it exists
            localStorage["ploneide.sessions.last"] = localStorage["ploneide.sessions.names.0"];
        }
    }

    return true;
}

function localStorageRenameSessionGroup(old_name, new_name){
    if (!supports_html5_storage()){
        return false;
    }


    // we first check our flag to know if there's record of any session at all
    if (!localStorage["ploneide.sessions"]){
        return false;
    }

    var renaming_current_session_group = false;
    if (localStorage["ploneide.sessions.last"] == old_name){
        renaming_current_session_group = true;
    }
    
    // We first need to rename the session from the global sessions list
    var i = 0;
    while (localStorage["ploneide.sessions.names."+i] != null){
        if (localStorage["ploneide.sessions.names."+i] == old_name){
            // We found the session, we need to rename it and break the loop
            localStorage["ploneide.sessions.names."+i] = new_name;
            break;
        }
        i++;
    }

    // Now, we copy the data from the old name to the newer
    i = 0;
    while (localStorage["ploneide.session."+old_name+"."+i] != null){
        localStorage["ploneide.session."+new_name+"."+i] = localStorage["ploneide.session."+old_name+"."+i];
        i++;
    }

    // Now, we need to purge the data for the old name
    localStoragePurgeSessionGroup(old_name);

    if (renaming_current_session_group){
        // In the case of renaming the existing session, we need to set the
        // global flag and the last session
        localStorage["ploneide.sessions"] = true;
        localStorage["ploneide.sessions.last"] = new_name;
    }

    return true;
}

function localStorageGetAllSessionGroups(){
    if (!supports_html5_storage()){
        return false;
    }

    // we first check our flag to know if there's record of any session at all
    if (!localStorage["ploneide.sessions"]){
        return false;
    }

    var sessions_names = [];

    // Now, we iterate over all names
    var i = 0;
    while (localStorage["ploneide.sessions.names."+i] != null){
        sessions_names.push(localStorage["ploneide.sessions.names."+i]);
        i++;
    }

    return sessions_names;

}


function localStorageGetLastSessionGroupName(){
    if (!supports_html5_storage()){
        return false;
    }

    // we first check our flag to know if there's record of any session at all
    if (!localStorage["ploneide.sessions"]){
        return false;
    }

    return localStorage["ploneide.sessions.last"];
}
