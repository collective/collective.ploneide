
/* XXX:
    Move this to a "generic" front-end dispatcher, eventually, when
    we have additional front-ends
    */

function hasFrontEnd(filename){
    if (filename == "configure.zcml"){
        return true;
    }

    return false;
}

function showHideFrontEndButton(){
    var session = env.editor.getSession();

    if (session.filename !== ""){
        var split = session.filename.split("/");
        var file_name = split.slice(-1).pop();

        if (hasFrontEnd(file_name)){
            $("a#front-end").show();
        }
        else{
            $("a#front-end").hide();
        }
    }
    else{
        $("a#front-end").hide();
    }
}

$(document).bind("session-switched", showHideFrontEndButton);

function switchFrontEnd(){
    if ($("#editor").is(':visible')){
        $("#editor").hide()
        $(".ace_editor").hide();
        var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT+'/zcml_frontend.html';
        $.ajax({type: 'GET',
                url: url,
                data: {},
                async: true,
                dataType: "html",
                success: function(results){
                        $('.editor-wrapper').append(results);
                        updateNamespaceValues();
                        updateDirectivesValues();
                        // ZCMLToHtml();
                        bindEvents();
                    }
            });
    }
    else{
        $(".ace_editor").show();
        $("#editor").show()
        $(".zcml-frontend").remove();
    }

}

function addNameSpace($this){
    $this.preventDefault();
    var namespace = $(this).attr('data-namespace');
    var ns_id = $(this).children("span").html();

    var elem = $(".namespaces").has("#"+ns_id+"_ns").length ? true : false;

    if (!elem){
        var div = $("<div></div>");
        div.attr("class", "namespace");
        div.attr("id", ns_id+"_ns");
        div.attr("data-namespace", namespace);

        var img = $("<img></img>");
        img.attr("src", "resources/icons/close.png");
        img.attr("class", "button");
        img.attr("alt", "Remove Namespace");
        img.attr("id", "remove-"+ns_id+"-namespace-icon");

        img.bind('click', function(e){
            $(this.parentNode).remove();
        })

        var span = $("<span></span>");
        span.text(ns_id);

        div.append(img);
        div.append(span);

        if (namespace == 'custom'){
            var p = $("<p></p>");
            var textarea = $("<textarea></textarea>");
            textarea.css('width', '300px');
            textarea.css('height', '60px');
            p.append(textarea);
            div.append(p);
        }

        $(".namespaces").append(div);
    }
}

function addDirective($this){
    $this.preventDefault();
    var directive = $(this).attr('data-directive');
    var index = $("#directives-count").val()*1;

    // var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    var url = 'http://localhost:8180';
    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'get-zcml-directive-html',
                   'directive': directive,
                    'index': index},
            async: false,
            dataType: "html",
            success: function(results){
                    $("div.zcml-directives").append(results);
                    index++;
                    $("#directives-count").val(index);
                }
        });
}

function updateDirectivesValues() {
    // var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    var url = 'http://localhost:8180';
    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'get-zcml-directives'},
            async : false,
            dataType: "text",
            success: function(results){
                    $('ul.possible-directives').prepend(results);
                }
        });
}

function updateNamespaceValues() {
    // var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    var url = 'http://localhost:8180';
    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'get-zcml-namespaces'},
            async : false,
            dataType: "text",
            success: function(results){
                    $('ul.possible-namespaces').prepend(results);
                }
        });
}

function bindEvents(){
    $(".top-menu a.namespace-element").bind("click", addNameSpace);
    $(".top-menu a.directive-element").bind("click", addDirective);

}
