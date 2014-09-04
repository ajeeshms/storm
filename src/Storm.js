/*
 * Storm JavaScript MVC Framework v0.1.0
 * Copyright 2014 Ajeesh M Sudhakaran
 * Date: 17/08/2014
*/
(function (window, $) {

    'use strict';

    // Creating Instance
    var storm = function () {
        if (!(this instanceof storm))
            return new storm();
    }

    storm.about = {
        version: '1.0.0',
        author: 'Ajeesh M Sudhakaran',
        date: '17/08/2014'
    }

    // #region Internal configurations and declarations
    var _st = {
        onSessionExpiration: function () { // Function to call on Session's Expiration (eg: for ajax calls failure)
            console.log('Session Expired');
        }
    };
    // #endregion

    // #region init function
    // initialize and configure library environment
    storm.init = function (settings) {
        if (settings['onSessionExpiration']) {
            _st.onSessionExpiration = settings.onSessionExpiration;
        }
    }
    // #endregion

    // #region delayExecute
    // delays execution of function for specific interval. consecutive calls within the time interval will be aborted
    storm.delayExecute = (function () {
        var timer = 0;
        return function (callback, ms) {
            clearTimeout(timer);
            timer = setTimeout(callback, ms);
        }
    })();
    // #endregion

    // #region Common Helpers
    storm.helpers = {
        guid: function () {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                           .toString(16)
                           .substring(1);
            };
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },
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
        },
        positionCenter: function () {
            var obj = arguments[0];
            if (!obj.jquery) {
                obj = $(obj);
            }
            obj.css({ top: '50%', left: '50%', margin: obj.height() / 2 * -1 + 'px 0 0 ' + obj.width() / 2 * -1 + 'px' });
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

            // Get value of a single property
            // get(propertyname) returns specific property
            // getAll() returns all properties as object
            model.prototype.get = function () {
                if (arguments.length == 1) {
                    var prop = arguments[0];
                    return (typeof this._data[prop] == 'function' ? this._data[prop]() : this._data[prop]);
                }
                else {
                    return this.getAll();
                }
            }

            // Returns values of all properties as object
            model.prototype.getAll = function () {
                var o = new Object();
                for (var prop in this._data) {
                    o[prop] = this.get(prop);
                }
                return o;
            }

            // Set values to properties
            // set(object) sets all properties from object
            // set(propertyname, value) sets single property
            model.prototype.set = function () {
                if (arguments.length == 2) {
                    var prop = arguments[0], value = arguments[1];
                    if (typeof this._data[prop] != 'function') {
                        this._data[prop] = value;
                    }
                    else { // if property is function, then pass value as argument
                        this._data[prop](value);
                    }
                    return this.get(prop);
                }
                else if (arguments.length == 1) {
                    return this.setAll(arguments[0]);
                }
            }

            // Set all values to properties
            // set(object) sets all values from object
            model.prototype.setAll = function () {
                var settings = arguments[0];
                for (var prop in settings) {
                    this.set(prop, settings[prop]);
                }
                return this.getAll();
            }

            // Synchronises model with server
            // sync(httpmetod, success, error)
            model.prototype.sync = function () {
                var url = (this.url || '');
                var method = (arguments[0] || 'GET');
                return storm.ajax({
                    url: url,
                    method: method,
                    data: this.getAll(),
                    headers: { Accept: 'application/json' },
                    success: arguments[2],
                    error: arguments[3]
                });
            }

            // post(success, error) synchronize model via post method
            model.prototype.post = function () {
                return this.sync('POST', arguments[0], arguments[1]);
            }

            // put(success, error) synchronize model via put method
            model.prototype.put = function () {
                return this.sync('PUT', arguments[0], arguments[1]);
            }

            // delete(success, error) synchronize model via delete method
            model.prototype.delete = function () {
                return this.sync('DELETE', arguments[0], arguments[1]);
            }



            // Setting Attributes of Model
            for (var prop in attributes) {
                if (prop != 'defaults') {
                    model.prototype[prop] = attributes[prop];
                }
            }

            // Binds a form/property-dom mapping with model
            // Mapping structure { PropertyName : css selector/dom object/jquery object }
            // It is also possible to map a model directly to form, simply pass form's css selector/dom object/jquery object to bind function
            model.prototype.bind = function () {
                var me = this;
                var arg = arguments[0];
                var mapping = new Object();
                var $domObj;
                if (typeof arg == 'string') { // If argument is string, select using jquery
                    $domObj = $(arg);
                }
                else if (typeof arg == 'object' && arg.tagName) { // if argument is dom object, wrap with jquery (a tagName property exist in dom objects)
                    $domObj = $(arg);
                }
                else if (typeof arg == 'object' && arg.jquery) { // else if jQuery object
                    $domObj = arg;
                }
                else { // else it is an actual property - dom object mapping provided
                    mapping = arg;
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
                me._mapping = mapping;
                return me;
            }
            

            // Init Function
            if (!model.prototype.init) { model.prototype.init = function () { }; }

            return model;
        }
    }
    // #endregion

    //#region collection
    storm.collection = function (settings) {

        settings = settings || new Object();

        // Internal collection
        var collection = function () {
            var me = this;
            me._data = [];
        }

        // To inset data into collection
        collection.prototype.add = function (data) {
            this._data.push(data);
            return this;
        }

        // Returns number of elements in collection
        collection.prototype.count = function () {
            return this._data.length;
        }

        // Returns first element to filter function. If no element found, returns undefined
        collection.prototype.firstOrDefault = function (func) {
            return this._data.filter(func)[0];
        }

        // Empty the collection
        collection.prototype.empty = function () {
            this._data = [];
            return this;
        }

        // Add multiple data into collection
        collection.prototype.insert = function (items) {
            if (Object.prototype.toString.call(items) == '[object Array]') {
                for (var i = 0; i < items.length ; i++) {
                    this.add(items[i]);
                }
            }
            else {
                this.add(items);
            }
            return this;
        }

        // Removes specific data from collection
        collection.prototype.remove = function (data) {
            var idx = this._data.indexOf(data);
            this._data.splice(idx, 1);
            return this;
        }

        // Remove element from specific index
        collection.prototype.removeAt = function (index) {
            this._data.splice(i, 1);
            return this;
        }

        // Replace a data item in collection by new one
        collection.prototype.replace = function (data, newData) {
            var idx = this._data.indexOf(data);
            if (idx >= 0) {
                this._data[idx] = newData;
            }
            return this;
        }

        // Select from each data in collection and return
        collection.prototype.select = function (func) {
            
            var result = [];

            for (var i = 0; i < this._data.length; i++) {
                var d = func(this._data[i]);
                if (d) {
                    result.push(d);
                }
            }

            return result;
        }

        // Returns underlying array
        collection.prototype.toArray = function () {
            return this._data;
        }

        collection.prototype.where = function (func) {
            return this._data.filter(func);
        }

        
        // Instance specific functionalities

        // Collections instance, which will be returned
        var collection_instance = new collection();
        
        // Applying settings to instance
        for (var prop in settings) {
            collection_instance[prop] = settings[prop];
        }
        
        // If expiry not specified, set 0 for default
        if (!settings.expiry) {
            collection_instance.expiry = 0;
        }

        // If onExpiry event not specified, create one which returns true.
        if (!settings.onExpiry) {
            collection_instance.onExpiry = function () {
                return true;
            }
        }

        // Expiration of collection's data. 
        // Set a timeout in minutes. When collection expires, it will fetch data from server
        if (collection_instance.expiry > 0 && collection_instance.sync) {
            
            // When onExpiry event returns false, automatic server sync will not be performed
            // Return true or nothing from onExpiry event to sync
            if (collection_instance.onExpiry != false) {
                storm.ajax({
                    url: collection_instance.sync.url,
                    method: collection_instance.sync.method,
                    success: function (data) {
                        collection_instance.empty().insert(data);
                    }
                });
            }
        }

        return collection_instance;
        
    }
    // #endregion

    // #region ajax
    storm.ajax = function (settings) {
        settings.url = (settings.url || '');
        settings.method = (settings.method || 'GET');
        settings.data = (settings.data || '');
        settings.headers = (settings.headers || {});
        settings.dataType = (settings.dataType || '*/*');
        settings.contentType = (settings.contentType || 'application/x-www-form-urlencoded; charset=UTF-8');

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200 && settings.success) {

                    // If response if JSON, parse string to JSON and return
                    if (xhr.getResponseHeader('Content-Type') == 'application/json; charset=utf-8' && xhr.responseText.length > 0) {
                        return settings.success(JSON.parse(xhr.responseText));
                    }
                    else {
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
        xhr.setRequestHeader('Accept', settings.dataType);
        xhr.setRequestHeader('Content-Type', settings.contentType);
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