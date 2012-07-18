/*****************

   jQuery Tools overlay helpers.

   Copyright © 2010, The Plone Foundation
   Licensed under the GPL, see LICENSE.txt for details.

*****************/

/*jslint browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, newcap: true, immed: true, regexp: false, white:true */
/*global jQuery, ajax_noresponse_message, window */

// Name space object for pipbox
var pb = {spinner: {}, overlay_counter: 1};

jQuery.tools.overlay.conf.oneInstance = false;

jQuery(function ($) {

    pb.spinner.show = function () {
        $('body').css('cursor', 'wait');
    };
    pb.spinner.hide = function () {
        $('body').css('cursor', '');
    };

    /******
        $.fn.prepOverlay jQuery plugin to inject overlay target into DOM and
        annotate it with the data we'll need in order to display it.
    ******/
    $.fn.prepOverlay = function (pba) {
        return this.each(function () {
            var o, pbo, config, onBeforeLoad, onLoad, src, parts;

            o = $(this);

            // copy options so that it's not just a reference
            // to the parameter.
            pbo = $.extend(true, {}, pba);

            // set overlay configuration
            config = pbo.config || {};

            // set onBeforeLoad handler
            onBeforeLoad = pb[pbo.subtype];
            if (onBeforeLoad) {
                config.onBeforeLoad = onBeforeLoad;
            }
            onLoad = config.onLoad;
            config.onLoad = function () {
                if (onLoad) {
                    onLoad.apply(this, arguments);
                }
                pb.fi_focus(this.getOverlay());
            };

            // be promiscuous, pick up the url from
            // href, src or action attributes
            src = o.attr('href') || o.attr('src') || o.attr('action');

            // translate url with config specifications
            if (pbo.urlmatch) {
                src = src.replace(new RegExp(pbo.urlmatch), pbo.urlreplace);
            }

            if (pbo.subtype === 'inline') {
                // we're going to let tools' overlay do all the real
                // work. Just get the markers in place.
                src = src.replace(/^.+#/, '#');
                $("[id='" + src.replace('#', '') + "']")
                    .addClass('overlay');
                o.removeAttr('href').attr('rel', src);
                // use overlay on the source (clickable) element
                o.overlay();
            } else {
                // save various bits of information from the pbo options,
                // and enable the overlay.

                // this is not inline, so in one fashion or another
                // we'll be loading it via the beforeLoad callback.
                // create a unique id for a target element
                pbo.nt = 'pb_' + pb.overlay_counter;
                pb.overlay_counter += 1;

                pbo.selector = pbo.filter || pbo.selector;
                if (!pbo.selector) {
                    // see if one's been supplied in the src
                    parts = src.split(' ');
                    src = parts.shift();
                    pbo.selector = parts.join(' ');
                }

                pbo.src = src;
                pbo.config = config;

                // remove any existing overlay and overlay handler
                pb.remove_overlay(o);                

                // save options on trigger element
                o.data('pbo', pbo);

                // mark the source with a rel attribute so we can find
                // the overlay, and a special class for styling
                o.attr('rel', '#' + pbo.nt);
                o.addClass('link-overlay');

                // for some subtypes, we're setting click handlers
                // and attaching overlay to the target element. That's
                // so we'll know the dimensions early.
                // Others, like iframe, just use overlay.
                switch (pbo.subtype) {
                case 'image':
                    o.click(pb.image_click);
                    break;
                case 'ajax':
                    o.click(pb.ajax_click);
                    break;
                case 'iframe':
                    pb.create_content_div(pbo);
                    o.overlay(config);
                    break;
                default:
                    throw "Unsupported overlay type";
                }

                // in case the click source wasn't
                // already a link.
                o.css('cursor', 'pointer');
            }
        });
    };


    /******
        pb.remove_overlay
        Remove the overlay and handler associated with a jquery wrapped
        trigger object
    ******/
    pb.remove_overlay = function (o) {
        var old_data = o.data('pbo');
        if (old_data) {
            switch (old_data.subtype) {
            case 'image':
                o.unbind('click', pb.image_click);
                break;
            case 'ajax':
                o.unbind('click', pb.ajax_click);
                break;
            default:
                // it's probably the jqt overlay click handler,
                // but we don't know the handler and are forced
                // to do a generic unbind of click handlers.
                o.unbind('click');
            }
            if (old_data.nt) {
                $('#' + old_data.nt).remove();
            }
        }
    };


    /******
        pb.create_content_div
        create a div to act as an overlay; append it to
        the body; return it
    ******/
    pb.create_content_div = function (pbo) {
        var content;

        content = $(
            '<div id="' + pbo.nt +
            '" class="overlay overlay-' + pbo.subtype +
            ' ' + (pbo.cssclass || '') +
            '"><div class="close"><span>Close</span></div></div>'
        );

        content.data('pbo', pbo);

        // if we've a width specified, set it on the overlay div
        if (pbo.width) {
            content.width(pbo.width);
        }

        // add the target element at the end of the body.
        content.appendTo($("body"));

        return content;
    };


    /******
        pb.image_click
        click handler for ajax sources.
    ******/
    pb.image_click = function (event) {
        var ethis, content, api, img, el, pbo;

        ethis = $(this);
        pbo = ethis.data('pbo');

        // find target container
        content = $(ethis.attr('rel'));
        if (!content.length) {
            content = pb.create_content_div(pbo);
            content.overlay(pbo.config);
        }
        api = content.overlay();

        // is the image loaded yet?
        if (content.find('img').length === 0) {
            // load the image.
            if (pbo.src) {
                pb.spinner.show();

                // create the image and stuff it
                // into our target
                img = new Image();
                img.src = pbo.src;
                el = $(img);
                content.append(el.addClass('pb-image'));

                // Now, we'll cause the overlay to
                // load when the image is loaded.
                el.load(function () {
                    pb.spinner.hide();
                    api.load();
                });

            }
        } else {
            api.load();
        }

        return false;
    };


    /******
        pb.fi_focus
        First-input focus inside $ selection.
    ******/
    pb.fi_focus = function (jqo) {
        if (! jqo.find("form div.error :input:first").focus().length) {
            jqo.find("form :input:visible:first").focus();
        }
    };


    /******
        pb.ajax_error_recover
        jQuery's ajax load function does not load error responses.
        This routine returns the cooked error response.
    ******/
    pb.ajax_error_recover = function (responseText, selector) {
        var tcontent = $('<div/>')
            .append(responseText.replace(/<script(.|\s)*?\/script>/gi, ""));
        return selector ? tcontent.find(selector) : tcontent;
    };


    /******
        pb.add_ajax_load
        Adds a hidden ajax_load input to form
    ******/
    pb.add_ajax_load = function (form) {
        if (form.find('input[name=ajax_load]').length === 0) {
            form.prepend($('<input type="hidden" name="ajax_load" value="' +
                (new Date().getTime()) +
                '" />'));
        }
    };

    /******
        pb.prep_ajax_form
        Set up form with ajaxForm, including success and error handlers.
    ******/
    pb.prep_ajax_form = function (form) {
        var ajax_parent = form.closest('.pb-ajax'),
            data_parent = ajax_parent.closest('.overlay-ajax'),
            pbo = data_parent.data('pbo'),
            formtarget = pbo.formselector,
            closeselector = pbo.closeselector,
            beforepost = pbo.beforepost,
            afterpost = pbo.afterpost,
            noform = pbo.noform,
            api = data_parent.overlay(),
            selector = pbo.selector,
            options = {};

        options.beforeSerialize = function () {
            pb.spinner.show();
        };

        if (beforepost) {
            options.beforeSubmit = function (arr, form, options) {
                return beforepost(form, arr, options);
            };
        }
        options.success = function (responseText, statusText, xhr, form) {
            $(document).trigger('formOverlayStart', [this, responseText, statusText, xhr, form]);
            // success comes in many forms, some of which are errors;
            //

            var el, myform, success, target;

            success = statusText === "success" || statusText === "notmodified";

            if (! success) {
                // The responseText parameter is actually xhr
                responseText = responseText.responseText;
            }
            // strip inline script tags
            responseText = responseText.replace(/<script(.|\s)*?\/script>/gi, "");

            // create a div containing the optionally filtered response
            el = $('<div />').append(
                selector ?
                    // a lesson learned from the jQuery source: $(responseText)
                    // will not work well unless responseText is well-formed;
                    // appending to a div is more robust, and automagically
                    // removes the html/head/body outer tagging.
                    $('<div />').append(responseText).find(selector)
                    :
                    responseText
                );

            // afterpost callback
            if (success && afterpost) {
                afterpost(el, data_parent);
            }

            myform = el.find(formtarget);
            if (success && myform.length) {
                ajax_parent.empty().append(el);
                pb.fi_focus(ajax_parent);

                pb.add_ajax_load(myform);
                // attach submit handler with the same options
                myform.ajaxForm(options);

                // attach close to element id'd by closeselector
                if (closeselector) {
                    el.find(closeselector).click(function (event) {
                        api.close();
                        return false;
                    });
                }
                $(document).trigger('formOverlayLoadSuccess', [this, myform, api, pb, ajax_parent]);
            } else {
                // there's no form in our new content or there's been an error
                if (success) {
                    if (typeof(noform) === "function") {
                        // get action from callback
                        noform = noform(this);
                    }
                } else {
                    noform = statusText;
                }


                switch (noform) {
                case 'close':
                    api.close();
                    break;
                case 'reload':
                    api.close();
                    pb.spinner.show();
                    // location.reload results in a repost
                    // dialog in some browsers; very unlikely to
                    // be what we want.
                    location.replace(location.href);
                    break;
                case 'redirect':
                    api.close();
                    pb.spinner.show();
                    target = pbo.redirect;
                    if (typeof(target) === "function") {
                        // get target from callback
                        target = target(this, responseText);
                    }
                    location.replace(target);
                    break;
                default:
                    if (el.children()) {
                        // show what we've got
                        ajax_parent.empty().append(el);
                    } else {
                        api.close();
                    }
                }
                $(document).trigger('formOverlayLoadFailure', [this, myform, api, pb, ajax_parent, noform]);
            }
            pb.spinner.hide();
        };
        // error and success callbacks are the same
        options.error = options.success;

        pb.add_ajax_load(form);
        form.ajaxForm(options);
    };


    /******
        pb.ajax_click
        Click handler for ajax sources. The job of this routine
        is to do the ajax load of the overlay element, then
        call the JQT overlay loader.
    ******/
    pb.ajax_click = function (event) {
        var ethis = $(this),
            pbo,
            content,
            api,
            src,
            el,
            selector,
            formtarget,
            closeselector,
            sep;

        e = $.Event(); 
    	  e.type = "beforeAjaxClickHandled";
        $(document).trigger(e, [this, event]);
        if (e.isDefaultPrevented()) { return; }

        pbo = ethis.data('pbo');

        content = pb.create_content_div(pbo);
        content.overlay(pbo.config);
        api = content.overlay();
        src = pbo.src;
        selector = pbo.selector;
        formtarget = pbo.formselector;
        closeselector = pbo.closeselector;

        pb.spinner.show();

        // prevent double click warning for this form
        $(this).find("input.submitting").removeClass('submitting');

        el = $('<div class="pb-ajax" />');
        if (api.getConf().fixed) {
            // don't let it be over 75% of the viewport's height
            el.css('max-height', Math.floor($(window).height() * 0.75));
        }
        content.append(el);

        // affix a random query argument to prevent
        // loading from browser cache
        sep = (src.indexOf('?') >= 0) ? '&': '?';
        src += sep + "ajax_load=" + (new Date().getTime());

        // add selector, if any
        if (selector) {
            src += ' ' + selector;
        }

        // set up callback to be used whenever new contents are loaded
        // into the overlay, to prepare links and forms to stay within
        // the overlay
        el[0].handle_load_inside_overlay = function(responseText, errorText) {
            var el = $(this);

            if (errorText === 'error') {
                el.append(pb.ajax_error_recover(responseText, selector));
            } else if (!responseText.length) {
                el.append(ajax_noresponse_message || 'No response from server.');
            }

            // a non-semantic div here will make sure we can
            // do enough formatting.
            el.wrapInner('<div />');

            // add the submit handler if we've a formtarget
            if (formtarget) {
                var target = el.find(formtarget);
                if (target.length > 0) {
                    pb.prep_ajax_form(target);
                }
            }

            // if a closeselector has been specified, tie it to the overlay's
            // close method via closure
            if (closeselector) {
                el.find(closeselector).click(function (event) {
                    api.close();
                    return false;
                });
            }

            // This may be a complex form.
            if ($.fn.ploneTabInit) {
                el.ploneTabInit();
            }

            // remove element on close so that it doesn't congest the DOM
            api.onClose = function () {
                content.remove();
            };
            $(document).trigger('loadInsideOverlay', [this, responseText, errorText, api]);
        }

        // and load the div
        el.load(src, null, function (responseText, errorText) {
            // post-process the overlay contents
            el[0].handle_load_inside_overlay.apply(this, [responseText, errorText]);

            // Now, it's all ready to display; hide the
            // spinner and call JQT overlay load.
            pb.spinner.hide();
            api.load();

            return true;
        });

        // don't do the default action
        return false;
    };


    /******
        pb.iframe
        onBeforeLoad handler for iframe overlays.

        Note that the spinner is handled a little differently
        so that we can keep it displayed while the iframe's
        content is loading.
    ******/
    pb.iframe = function () {
        var content, pbo;

        pb.spinner.show();

        content = this.getOverlay();
        pbo = this.getTrigger().data('pbo');

        if (content.find('iframe').length === 0 && pbo.src) {
            content.append(
                '<iframe src="' + pbo.src + '" width="' +
                 content.width() + '" height="' + content.height() +
                 '" onload="pb.spinner.hide()"/>'
            );
        } else {
            pb.spinner.hide();
        }
        return true;
    };

    // $('.newsImageContainer a')
    //     .prepOverlay({
    //          subtype: 'image',
    //          urlmatch: '/image_view_fullscreen$',
    //          urlreplace: '_preview'
    //         });

});
