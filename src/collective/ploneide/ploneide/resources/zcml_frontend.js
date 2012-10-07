
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

}

function openSubMenu() {
    $(this).children('ul').css('visibility', 'visible');    
};

function closeSubMenu() {
    $(this).children('ul').css('visibility', 'hidden'); 
};

function updateDirectivesValues() {
    // var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
    var url = 'http://localhost:8180';
    $.ajax({type: 'POST',
            url: url,
            data: {'command': 'get-zcml-directives'},
            async : false,
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
            success: function(results){
                    $('ul.possible-namespaces').prepend(results);
                }
        });
}

function bindEvents(){
    // $('.add-new-menu > li').bind('mouseover', openSubMenu);
    // $('.add-new-menu > li').bind('mouseout', closeSubMenu);

    // $('.directive-sub-menu').bind('mouseover', openSubMenu);
    // $('.directive-sub-menu').bind('mouseout', closeSubMenu);
   
    $(".footer-elements a.namespace-element").bind("click", addNameSpace);
    $(".footer-elements a.directive-element").bind("click", addDirective);
}
