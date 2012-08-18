/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
 
define(function(require, exports, module) {
"use strict";

var oop = require("../ace/lib/oop");
var Mirror = require("../ace/worker/mirror").Mirror;

var Worker = exports.Worker = function(sender) {
    Mirror.call(this, sender);
    this.setTimeout(500);
};

oop.inherits(Worker, Mirror);

(function() {
    
    this.onUpdate = function() {
        // XXX: This is SO SO SO SO SO SOOOOOOOO Ugly.... please, look somewhere else... :P
        // console.log(this);
        var value = this.doc.getValue();
        var url = location.href;
        var xhReq = new XMLHttpRequest();

        xhReq.open("POST", url, true);
        xhReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        var params = "command=python-static-check&content="+encodeURIComponent(value);

        xhReq.sender = this.sender;

        xhReq.onreadystatechange = function() {
            if(xhReq.readyState == 4 && xhReq.status == 200) {
                xhReq.sender.emit("python_static_check", xhReq.responseText);
            }
        }
        xhReq.send(params);

        // var value = env.editor.session.doc.getValue();
        // var params = "command=python-static-check&content="+value;
        // var xhReq = new XMLHttpRequest();
        // xhReq.open("POST", url, false);
        // xhReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        // xhReq.setRequestHeader("Content-length", params.length);
        // xhReq.setRequestHeader("Connection", "close");
        // xhReq.send(params);
        // var serverResponse = xhReq.responseText;

        // require(["jquery"], function($) {
        //     $(function() {
        //         var url = 'http://'+window.$PLONEIDE_HOST+':'+window.$PLONEIDE_PORT;
                
        //         $.post(url,
        //                 {'command':'python-static-check',
        //                  'content':value
        //                 },
        //                 function(results){
        //                     this.sender.emit("python_static_check", result);
        //                 });
        //     });
        // });
        // var result = pythonStaticCheck(value);
        // console.log($);
        // console.log($);
        
                    
        // var result = CSSLint.verify(value);
        // this.sender.emit("csslint", result.messages.map(function(msg) {
        //     delete msg.rule;
        //     return msg;
        // }));
    };
    
}).call(Worker.prototype);

});
