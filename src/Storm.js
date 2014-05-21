/*
 * Storm JavaScript MVC Framework v0.1.0
 * Copyright 2014 Ajeesh M Sudhakaran
 * Date: 20/05/2014
*/
(function (window, $) {

    'use strict';

    // Creating Instance
    var storm = function () {
        return new storm();
    }

    storm.about = {
        version: '0.1.0',
        author: 'Ajeesh M Sudhakaran',
        date: '20/05/2014'
    }

    // #region Internal configurations and declarations
    var _st = {
        onSessionExpiration: undefined // Function to call on Session's Expiration (eg: for ajax calls failure)
    };
    // #endregion

    // #region Common Helpers
    storm.helpers = {
        // Encode given object to URI string
        encodeURI: function (obj, prefix) {
            var str = [];
            for (var p in obj) {
                var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
                str.push(typeof v == "object" ?
                  serialize(v, k) :
                  encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }
            return str.join("&");
        }
    }
    // #endregion

    // #region model
    storm.model = {
        extend: function (attributes) {
            var model = function (settings) {
                var me = this;
                // Applying Settings
                for (var property in settings) {
                    me[property] = settings[property];
                }

                // calling init function, the first function to execute
                me.init.apply(this, arguments);
            }
            // Setting Properties
            for (var property in attributes) {
                model.prototype[property] = attributes[property];
            }
            // Setting Init Function
            if (!model.prototype.init) { model.prototype.init = function () { }; }

            // If model has a url property, then setup ajax methods
            if (model.url) {

            }
            return model;
        },
        serialize: function (model) {
            var exclude = ['init', 'onChange', 'onSync'];
            var o = new Object();
            for (var prop in model) {
                if (prop.indexOf('_') == 0 || exclude.indexOf(prop) >= 0) {
                    continue;
                }
                else {
                    o[prop] = typeof (model[prop]) == 'function' ? model[prop]() : model[prop];
                }
            }
            return o;
        }
    }
    // #endregion

    // #region ajax
    storm.ajax = function (settings) {
        settings.url = (settings.url || '');
        settings.method = (settings.method || 'GET');
        settings.data = (settings.data || '');
        settings.headers = (settings.headers || {});
        settings.dataType = (settings.dataType || 'application/x-www-form-urlencoded');

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200 && settings.success) {
                    try {
                        return settings.success(JSON.parse(xhr.responseText));
                    }
                    catch (e) {
                        return settings.success(xhr.response);
                    }
                }
                else if (xhr.status == 401 && _st.onSessionExpiration) {
                    return _st.onSessionExpiration();
                }
                else {
                    if (settings.error) {
                        return settings.error();
                    }
                }
            }
        }

        xhr.open(settings.method, settings.url);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', settings.dataType);
        for (var h in settings.headers) {
            xhr.setRequestHeader(h.toString(), settings.headers[h].toString());
        }

        xhr.send(storm.helpers.encodeURI(settings.data));

        // Progress Event
        if (settings.progress && xhr.onprogress) {
            xhr.onprogress = function (e) {
                return settings.progress(e.loaded * 100 / e.total);
            }
        }
        return xhr;


    }
    // #endregion

    
    // Exposing Globally
    window.storm = window.st = storm;

})(this, jQuery);