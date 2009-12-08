/*
**  jquery.debug.js -- jQuery plugin for debugging
**  Copyright (c) 2007 Ralf S. Engelschall <rse@engelschall.com> 
**  Licensed under GPL <http://www.gnu.org/licenses/gpl.txt>
**
**  $LastChangedDate$
**  $LastChangedRevision$
*/

(function($) {
    /* jQuery class extension methods */
    $.extend({
        /* boolean status whether debugging is enabled */
        _debug$: null,

        /* method for getting and setting debug status */
        debug: function (onoff) {
            var old_value = ($._debug$ == true ? true : false);
            $._debug$ = (onoff ? true : false);
            return old_value;
        },

        /* method for logging an object or message */
        log: function (message) {
            if ($._debug$ == true)
                console.debug(message);
        }
    });

    /* jQuery object extension methods */
    $.fn.extend({
        /* method for logging all jQuery items */
        log: function (message) {
            if ($._debug$ == true) {
                return this.each(function () {
                    if (typeof message !== "undefined")
                        $.log(message);
                    $.log(this);
                });
            }
        }
    });

    /* determine default enable status */
    $(document).ready(function () {
        var req = $("html").attr("debug");
        if (req == "true" || req == "false")
            $.debug(req == "true" ? true : false);
    });

    /* minimum Firebug emulation (see http://getfirebug.com/firebug/firebugx.js) */
    $(document).ready(function () {
        if (typeof window.console === "undefined") {
            /* minimum conversion of arbitrary object to text representation */
            function object2text (obj) {
                var text = null;
                if (typeof obj === "undefined")
                    text = "[undefined]";
                else if (typeof obj === "boolean")
                    text = (obj ? "true" : "false");
                else if (typeof obj === "number")
                    text = "" + obj;
                else if (typeof obj === "string")
                    text = obj;
                else if (typeof obj === "function")
                    text = obj;
                else if (typeof obj === "object") {
                    if (typeof obj.nodeType !== "undefined") {
                        if (obj.nodeType == 1) { /* W3C DOM element node */
                            text = '&lt;';
                            text += obj.nodeName.toLowerCase();
                            for (var i = 0; i < obj.attributes.length; i++)
                                text += ' ' + obj.attributes[i].nodeName.toLowerCase() +
                                        '="' + obj.attributes[i].nodeValue + '"';
                            text += '&gt;';
                        }
                        else if (obj.nodeType == 2) /* W3C DOM attribute node */
                            text = obj.nodeName + '="' + obj.nodeValue;
                        else if (obj.nodeType == 3) /* W3C DOM text node */
                            text = obj.nodeValue;
                    }
                    else if (typeof obj.toJSONString !== "undefined")
                        text = obj.toJSONString();
                    else if (typeof obj.toString !== "undefined")
                        text = obj.toString();
                }
                if (text == null)
                    text = "[unknown]";
                return text;
            };

            /* create the logging <div> node */
            $(document).ready(function () {
                $("body")
                    .append('<div id="jQueryDebug"><ol></ol></div>');
                $("#jQueryDebug")
                    .css("display", "none")
                    .css("fontFamily", "monospace")
                    .css("backgroundColor", "#ffffff")
                    .css("color", "#000000")
                    .css("padding", "10px 0px 10px 0px")
                    .css("border", "4px solid #666699")
                    .css("margin", "4px 4px 4px 4px");
                $("#jQueryDebug ol")
                    .css("margin", "0px 0px 0px 0px")
                    .css("paddingRight", "20px");
            });

            /* attach a function to each of the Firebug methods */
            var names = [
                "log", "debug", "info", "warn", "error", "assert",
                "dir", "dirxml", "group", "groupEnd", "time", "timeEnd",
                "count", "trace", "profile", "profileEnd"
            ];
            window.console = {};
            for (var i = 0; i < names.length; i++) {
                window.console[names[i]] = function(msg) {
                    $('#jQueryDebug')
                        .css("display", $._debug$ == true ? "block" : "none");
                    $('#jQueryDebug ol')
                        .append('<li>' + object2text(msg) + '</li>').css;
                    $("#jQueryDebug ol li")
                        .css("borderBottom", "1px solid #cccccc")
                        .css("padding", "1px 10px 1px 10px");
                }
            }

            /* indicate that we are the one who is proving the Firebug interface */
            window.console["jQueryDebug"] = true;
        }
    });

})(jQuery);