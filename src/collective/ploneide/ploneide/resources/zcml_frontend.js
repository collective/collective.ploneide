
function addNameSpace($this){
    $this.preventDefault();
    var namespace = $(this).attr('data-namespace');

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
                    $('ul.directives').prepend(results);
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
                    $('ul.namespaces').prepend(results);
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
