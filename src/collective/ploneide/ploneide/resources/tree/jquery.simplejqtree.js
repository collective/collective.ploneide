(function( $ ){

    $.fn.simplejqtree = function(options) {  

        var settings = {
            'ajax'           : false, //an ajax call?
            'ajax_handler'   : {},    //the ajax method used to do the ajax call
            'action_handler' : {}     //the action to trigger when a non-folderish item is "clicked"
        };

        return this.each(function() {        
            if ( options ) { 
                $.extend( settings, options );
            }

            //lets format the tree
            tree_elements = $.fn.simplejqtree.formatMarkup(this, settings.ajax);
            $.fn.simplejqtree.eventsSetup( tree_elements, settings.ajax_handler, settings.action_handler );

        });

    };


    //Public functions
    $.fn.simplejqtree.formatMarkup = function( tree, ajax ) {
  
        var empty_image = '<img class="dummy" alt="icon" src="data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">';
        var items = $('a', tree).prepend($(empty_image)
                                .addClass('icon'));
        var branches = $('li', tree).prepend(empty_image);

        branches.each(function(){
            var container = $('> ul', $(this)).addClass('container');
          
            if (container[0]) {
                $(this).addClass('folderish').children('img')
                                             .addClass('arrow');
            }
        });

        if (!ajax) {
            $(tree).addClass('tree');
        } else {
            $(tree).addClass('container');
        }

        return items;
    };


    $.fn.simplejqtree.eventsSetup = function( items, ajax_handler, action_handler ) {
        items.bind('click.simplejqtree',  function(event){
            event.preventDefault();      
            var container = $(this).siblings('.container');
            var branch = $(this).parent('.folderish');
        
            if ($(container).html() === '' && ajax_handler) {
                if (typeof ajax_handler.data === 'function' || ajax_handler.data_back) {
                    ajax_handler.data_back = ajax_handler.data_back ? ajax_handler.data_back : ajax_handler.data;
                    ajax_handler.data = ajax_handler.data_back($(this));
                }    
                var ajax_extended = $.extend(ajax_handler, {"dataType":'json', "success":function(data) {
                    var result = $.fn.simplejqtree.buildFromJSON(data);
                    $('> ul', branch).remove();
                    branch.append(result);
                    result.simplejqtree({'ajax_handler':ajax_handler, 'ajax':true, 'action_handler':action_handler});
                    var container = result;            
                    slide_events(container, branch);
                }});                
                
                $.ajax(ajax_extended);
            } else {
                slide_events(container, branch);
            }
            
            action_handler_launcher($(this), action_handler);
            
        });
        items.each(function(){
            var $this = $(this);
            $this.siblings('.arrow').click(function(){
                $this.trigger('click.simplejqtree');
            });
        });
    
        function slide_events(container, branch){
            if (container.css('display') == 'none'){
                container.slideDown('fast', function(){
                    branch.addClass('opened');          
                });
            } else {
                container.slideUp('fast', function(){
                    branch.removeClass('opened');                    
                });
            }    
        }
        
        function action_handler_launcher(item, action_handler) {
            if ( typeof action_handler === 'function' && !item.parent('.folderish')[0]) {
                action_handler(item);
            }
        }
    };


    $.fn.simplejqtree.buildFromJSON = function (json, parent) {
        if (!parent){
            parent = $('<ul></ul>');
        }else {
            parent = $('> ul', parent.append($('<ul></ul>'))).filter(":last");
        }
        $(json).each(function(){
            var li = $('<li><a href="#">'+this.title+'</a></li>');
            li.addClass(this.opened ? 'opened': undefined);
            $('> a', li).addClass(this.metatype)
                        .attr({
                            'id': this.id,
                            'href': this.href,
                            'rel': this.rel
                        });
            parent.append(li);
            var folderish = this.folderish;
            var has_child = this.children;
            if (folderish) {
                if (has_child) {
                    $.fn.simplejqtree.buildFromJSON(has_child, $('> li', parent));
                } else {
                    li.prepend('<ul></ul>');
                }
            }
        });
        return parent;
    };
    
})( jQuery );
