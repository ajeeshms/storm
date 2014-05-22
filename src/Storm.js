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
        onSessionExpiration: function () { // Function to call on Session's Expiration (eg: for ajax calls failure)
            console.log('Session Expired');
        }
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
                    me._data[property] = settings[property];
                }

                // calling init function, the first function to execute
                me.init.apply(this, arguments);
            }

            // Data object
            model.prototype._data = new Object();

            // Setting Default properties
            if (attributes.defaults) {
                for (var prop in attributes.defaults) {
                    model.prototype._data[prop] = attributes.defaults[prop];
                }
            }

            // get function, to get properties
            model.prototype.get = function (prop) {
                return (typeof this._data[prop] == 'function' ? this._data[prop]() : this._data[prop]);
            }

            // getAll function, to return all properties as object
            model.prototype.getAll = function () {
                var o = new Object();
                for (var prop in this._data) {
                    o[prop] = this.get(prop);
                }
                return o;
            }

            // set function, to set values to properties
            model.prototype.set = function (prop, value) {
                if (typeof this._data[prop] != 'function') {
                    this._data[prop] = value;
                }
                return this.get(prop);
            }

            // Setting Attributes of Model
            for (var prop in attributes) {
                if (prop != 'defaults') {
                    model.prototype[prop] = attributes[prop];
                }
            }

            // Bind Function
            model.prototype.bind = function () {
                var me = this;
                var arg = arguments[0];
                var mapping = new Object();
                var $domObj;
                if (typeof arg == 'string') { // If argument is string, select using jquery
                    $domObj = $(arg);
                }
                else if (typeof arg == 'object' && arg.tagName) { // if argument is dom object, wrap with jquery
                    $domObj = $(arg);
                }
                else if (typeof arg == 'object' &&  arg.jquery) { // else if jQuery object
                    $domObj = arg;
                }
                // if parameter was a dom or jQuery object, then iterate through its children and create property-input mapping
                if ($domObj) {
                    $domObj.find('[name]').each(function (i, elem) { // Creating mapping from dom's children
                        mapping[elem.name.toString()] = $(elem); 
                    });
                }
                // Iterating through mapping and binding change event
                for (var prop in mapping) {
                    var $input = mapping[prop].jquery ? mapping[prop] : $(mapping[prop]);  // wrapping with jQuery
                    $input.change(function (e) {
                        var property_name = e.target.getAttribute('Name');
                        me.set(property_name, (isFinite(e.target.value) ? (e.target.value * 1) : e.target.value.trim()));
                        if (me.onChange) { me.onChange(e.target); }
                    });
                }
            }

            // Init Function
            if (!model.prototype.init) { model.prototype.init = function () { }; }

            return model;
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