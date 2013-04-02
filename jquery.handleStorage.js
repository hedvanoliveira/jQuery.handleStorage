/**
 * Description: A jQuery plug-in to client storage using localStorage,
 *              sessionStorage or the depreciated cookie option
 *
 * Fork me @ https://www.github.com/jas-/jquery.handleStorage
 *
 * Author: Jason Gerfen <jason.gerfen@gmail.com>
 * License: GPL (see LICENSE)
 */

(function($){

	/**
	 * @function handleStorage
	 * @abstract
	 * @param method string
	 * @param options object
	 */
	$.fn.handleStorage = function(method) {

		/**
		 * @object defaults
		 * @abstract Default set of options for plug-in
		 *
		 * @param {String}      appID			Unique identifier for referencing storage object
		 * @param {String}      storage         localStorage, sessionStorage or cookies
		 * @param {Object}      element			Element to which this plug-in is bound
		 * @param {Integer}     interval        Default time in seconds for auto-save
		 * @param {String}      uuid            Unique machine identifier
		 * @param {Object}      data            Data to be saved (JSON)
		 * @param {Boolean}     aes             Use encryption for locally saved data
		 * @param {Boolean}     debug			Enable or disable debugging options
		 * @param {Function}    callback		Callback function for success
		 * @param {Object}      precallback		Callback prior to send
		 * @param {Object}      errcallback		Callback on errors
		 */
        var defaults = {
            appID:          'jQuery.handleStorage',
            storage:        'local',
            element:        $(this),
            interval:       5000,
            uuid:           '',
            data:           {},
            aes:            false,
            debug:          false,
            callback:       function(){},
            preCallback:    function(){},
            errCallback:    function(){}
        };

		/**
		 * @method methods
		 * @scope public
		 * @abstract Public methods
		 *  - init
		 */
		var methods = methods || {

			/**
			 * @function init
			 * @scope public
			 * @abstract
			 */
			init: function(o){

				/* Merge user supplied options with defaults */
				var opts = _setup.merge(o, defaults);

				/* Initialize setup */
				if (!_setup.init(opts)) {
					return false;
				}

				return true;
			}
		};

		/**
		 * @method _setup
		 * @scope private
		 * @abstract Initial setup routines
		 */
		var _setup = _setup || {

			/**
			 * @function save
			 * @scope private
			 * @abstract Initialization
			 *
			 * @param {Object} o Plug-in option object
			 * @returns {Boolean}
			 */
			init: function(o){
                _log.init();
                o.uuid = (o.aes) ? _crypto.key(o) : o.uuid;
                return _setup.bind(o, o.element);
			},

			/**
			 * @function merge
			 * @scope private
			 * @abstract Perform preliminary option/default object merge
			 *
			 * @param {Object} o Plug-in option object
			 * @param {Object} d Default plug-in option object
			 * @returns {Object}
			 */
			merge: function(o, d){
				return $.extend({}, d, o);
			},

			/**
			 * @function bind
			 * @scope private
			 * @abstract Apply supplied 'data' DOM element processing or
			 *           object return
			 *
			 * @param {Object} o Plug-in option object
			 * @param {Object} d User supplied key/value pair object or DOM element
			 * @returns {Object}
			 */
			bind: function(o, d){
				var _d = false;
				if ((d).is('form')){

					(o.debug) ? _log.debug(o.appID, '_setup.get: Currently bound to form ('+d.attr('id')+')') : false;

                    _setup.restore(o, d.attr('id'));

					$(d).on('submit', function(e){
						e.preventDefault();
						_d = _libs.form(o, d);
                        _storage.save(o, d.attr('id'), _d);
					});
				} else {
					((o.debug) && (_d)) ? _log.debug(o.appID, '_setup.get: User supplied data specified') : false;
				}
				return _d;
			},

			/**
			 * @function restore
			 * @scope private
			 * @abstract Restores data to specified element
			 *
			 * @param {Object} o Plug-in option object
			 * @param {Object} k ID of DOM element

			 * @returns {Object}
			 */
			restore: function(o, k){
                var _e = _storage.retrieve(o, k);
                if (_e)
                    (/object/.test(_e)) ? _libs.inspect(o, _e) : false;
            }
		};

		/**
		 * @method _storage
		 * @scope private
		 * @abstract Interface to handle storage options
		 */
		var _storage = _storage || {

			/**
			 * @function quota
			 * @scope private
			 * @abstract Tests specified storage option for current amount of space available.
			 *  - Cookies: 4K
			 *  - localStorage: 5MB
			 *  - sessionStorage: 5MB
			 *  - default: 5MB
			 *
			 * @param {String} i Current value of appID
			 * @param {String} t Type of storage specified
			 * @param {Boolean} d Debug enabled
			 *
			 * @returns {Boolean}
			 */
			quota: function(i, t, d) {
				var l = /local|session/.test(t) ? 1024 * 1025 * 5 : 1024 * 4;
				var _t = l - unescape(encodeURIComponent(JSON.stringify(t))).length;
				if (_t <= 0) {
					_log.error(i, 'Maximum quota ('+l+'k) for '+t+' has been met, cannot continue');
					return false;
				}
				(d) ? _log.debug(i, '_storage.quota: Maximum quota ('+l+'k) for '+t+' has not been met. Current total: '+_t+'k') : false;
				return true;
			},

			/**
			 * @function save
			 * @scope private
			 * @abstract Interface for saving to available storage mechanisms
			 *
			 * @param {String} o Default options
			 * @param {String} k Storage key to use for indexing of newly saved string/object
			 * @param {String|Object} v Value of data to be saved (string or object)
			 *
			 * @returns {Boolean}
			 */
			save: function(o, k, v){
				var x = false;

				/* Ensure space is available */
				if (_storage.quota(o.appID, o.storage, o.debug)){

                    /* merge/overwrite any existing object with new values */
                    var e = _storage.retrieve(o, k);
                    if (_libs.size(e) > 0) {
                        $.extend(v, e);
                    }

					/* encrypt object if AES is specified */
                    v = (o.aes) ? sjcl.encrypt(o.uuid, _storage.fromJSON(v)) : _storage.fromJSON(v);

					/* Save to specified storage mechanism */
					switch(o.storage) {
						case 'cookie':
							x = this._cookie.save(o, k, v);
							break;
						case 'local':
							x = this._local.save(o, k, v);
							break;
						case 'session':
							x = this._session.save(o, k, v);
							break;
						default:
							x = this._local.save(o, k, v);
							break;
					}
				}

				return x;
			},

			/**
			 * @function retrieve
			 * @scope private
			 * @abstract Interface for retrieving from available storage mechanisms
			 *
			 * @param {Object} o Default options
			 * @param {String} k Storage key to use for indexing of newly saved string/object
			 *
			 * @returns {Object}
			 */
			retrieve: function(o, k){
				var x = {};

				/* Retrieve from specified storage mechanism */
				switch(o.storage) {
					case 'cookie':
						x = this._cookie.retrieve(o, k);
						break;
					case 'local':
						x = this._local.retrieve(o, k);
						break;
					case 'session':
						x = this._session.retrieve(o, k);
						break;
					default:
						x = this._local.retrieve(o, k);
						break;
				}

                if (x) {
                    x = (o.aes) ? sjcl.decrypt(o.uuid, x) : x;

                    return (/string/.test(typeof(x))) ? _storage.toJSON(x) : x;
                }

				return false;
			},

			/**
			 * @function fromJSON
			 * @scope private
			 * @abstract Convert to JSON object to string
			 *
			 * @param {Object|Array|String} obj Object, Array or String to convert to JSON object
			 *
			 * @returns {String}
			 */
			fromJSON: function(obj){
				return (/object/.test(typeof(obj))) ? JSON.stringify(obj) : obj;
			},

			/**
			 * @function toJSON
			 * @scope private
			 * @abstract Creates JSON object from formatted string
			 *
			 * @param {String} obj Object to convert to JSON object
			 *
			 * @returns {String}
			 */
			toJSON: function(obj){
				return (/string/.test(typeof(obj))) ? JSON.parse(obj) : obj;
			},

			/**
			 * @method _cookie
			 * @scope private
			 * @abstract Method for handling setting & retrieving of cookie objects
			 */
			_cookie: {

				/**
				 * @function save
				 * @scope private
				 * @abstract Handle setting of cookie objects
				 *
				 * @param {Object} o Application defaults
				 * @param {String} k Key to use for cookies
				 * @param {String|Object} v String or object to place in cookie
				 *
				 * @returns {Boolean}
				 */
				save: function(o, k, v){
					var d = new Date();
					d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
					document.cookie = k+'='+v+';expires='+d.toGMTString()+';path=/;domain='+this.domain();
					(o.debug) ? _log.debug(o.appID, '_cookies.save: '+k+' => '+v) : false;
					return true;
				},

				/**
				 * @function retrieve
				 * @scope private
				 * @abstract Handle retrieval of cookie objects
				 *
				 * @param {Object} o Application defaults
				 * @param {String} k cookie key
				 *
				 * @returns {String|False}
				 */
				retrieve: function(o, k){
					var i,x,y,z=document.cookie.split(";");
					for (i = 0; i < z.length; i++){
						x = z[i].substr(0, z[i].indexOf('='));
						y = z[i].substr(z[i].indexOf('=') + 1);
						x = x.replace(/^\s+|\s+$/g, '');
						if (x == k){
							(o.debug) ? _log.debug(o.appID, '_cookies.retrieve: '+k+' => '+y) : false;
							return unescape(y);
						}
					}
					return false;
				},

				/**
				 * @function domain
				 * @scope private
				 * @abstract Provides current domain of client for cookie realm
				 *
				 * @returns {String}
				 */
				domain:	function(){
					return location.hostname;
				}
			},

			/**
			 * @method local
			 * @scope private
			 * @abstract Method for handling setting & retrieving of localStorage objects
			 */
			_local: {

				/**
				 * @function save
				 * @scope private
				 * @abstract Handle setting & retrieving of localStorage objects
				 *
				 * @param {Object} o Application defaults
				 * @param {String} k Key to use for localStorage
				 * @param {String|Object} v String or object to place in localStorage
				 *
				 * @returns {Boolean}
				 */
				save: function(o, k, v){
					(o.debug) ? _log.debug(o.appID, '_local.save: '+k+' => '+v) : false;
					return localStorage.setItem(k, v);
				},

				/**
				 * @function retrieve
				 * @scope private
				 * @abstract Handle retrieval of localStorage objects
				 *
				 * @param {Object} o Application defaults
				 * @param {String} k localStorage key
				 *
				 * @returns {Object|String|Boolean}
				 */
				retrieve: function(o, k){
                    var x = localStorage.getItem(k);
					(o.debug) ? _log.debug(o.appID, '_local.retrieve: '+k+' => '+x) : false;
					return (x) ? x : false;
				}
			},

			/**
			 * @method session
			 * @scope private
			 * @abstract Method for handling setting & retrieving of sessionStorage objects
			 */
			_session: {

				/**
				 * @function save
				 * @scope private
				 * @abstract Save session storage objects
				 *
				 * @param {Object} o Application defaults
				 * @param {String} k Key to use for sessionStorage
				 * @param {String|Object} v String or object to place in sessionStorage
				 *
				 * @returns {Boolean}
				 */
				save: function(o, k, v){
					(o.debug) ? _log.debug(o.appID, '_session.save: '+k+' => '+v) : false;
					return localStorage.setItem(k, v);
				},

				/**
				 * @function retrieve
				 * @scope private
				 * @abstract Retrieves sessionStorage objects
				 *
				 * @param {Object} o Application defaults
				 * @param {String} k sessionStorage key
				 *
				 * @returns {Object|String|Boolean}
				 */
				retrieve: function(o, k){
                    var x = sessionStorage.getItem(k);
					(o.debug) ? _log.debug(o.appID, '_session.retrieve: '+k+' => '+x) : false;
					return (x) ? x : false;
				}
			}
		};

		/**
		 * @method _crypto
		 * @scope private
		 * @abstract Interface to handle encryption option
		 */
		var _crypto = _crypto || {

			/**
			 * @function key
			 * @scope private
			 * @abstract Prepares key for encryption/decryption routines
			 *
			 * @param {Object} o Global options object
			 *
			 * @returns {String}
			 */
			key: function(o) {
                (o.debug) ? _log.debug(o.appID, '_crypto.key: Prepared key') : false;

                var _p = _crypto.uid();
				return sjcl.codec.hex.fromBits(sjcl.misc.pbkdf2(_p, _crypto.salt(_p), 1000, 256));
			},

			/**
			 * @function uid
			 * @scope private
			 * @abstract Generates a machine identifier
			 *
			 * @returns {String}
			 */
            uid: function(){
                var x = window.navigator.appName+
                        window.navigator.appCodeName+
                        window.navigator.product+
                        window.navigator.productSub+
                        window.navigator.appVersion+
                        window.navigator.buildID+
                        window.navigator.userAgent+
                        window.navigator.language+
                        window.navigator.platform+
                        window.navigator.oscpu;
                return x.replace(/\s/, '');
            },

			/**
			 * @function salt
			 * @scope private
			 * @abstract Creates salt from string & iv
			 *
			 * @param {String} str Machine identification used as salt
			 *
			 * @returns {String}
			 */
            salt: function(str){
                var slt = _crypto.iv(str);
                var _h = []; _h[0] = sjcl.hash.sha256.hash(str);
                var _r = []; _r = _h[0]; var _d;
                for (i = 1; i < 3; i++){
                    _h[i] = sjcl.hash.sha256.hash(_h[i - 1].concat(slt));
                    _d = _r.concat(_h[i]);
                }
                return JSON.stringify(sjcl.codec.hex.fromBits(_d));
            },

			/**
			 * @function iv
			 * @scope private
			 * @abstract Creates IV based on UID
			 *
			 * @param {String} str Supplied string
			 *
			 * @returns {String}
			 */
            iv: function(str){
                return (str) ? encodeURI(str.replace(/-/gi, '').substring(16, Math.ceil(16 * str.length) % str.length)) : false;
            }
        };

		/**
		 * @method _libs
		 * @scope private
		 * @abstract Miscellaneous helper libraries
		 */
		var _libs = _libs || {

			/**
			 * @function inspect
			 * @scope private
			 * @abstract Inspects objects & arrays recursively
			 *
			 * @param {Object} o Default options
			 * @param {Array|Object} obj An object or array to be inspected
			 */
			inspect: function(o, obj){
				$.each(obj, function(x, y){
					if ((/object|array/.test(typeof(y))) && (_libs.size(y) > 0)){
						(o.debug) ? _log.debug(o.appID, '_libs.inspect: Examining '+x+' ('+typeof(y)+')') : false;
						_libs.inspect(o, y);
					} else {
						(o.debug) ? _log.debug(o.appID, '_libs.inspect: '+x+' => '+y) : false;
					}
				});
			},

			/**
			 * @function size
			 * @scope private
			 * @abstract Perform calculation on objects
			 *
			 * @param {Object|Array} obj The object/array to calculate
			 *
			 * @returns {Integer}
			 */
			size: function(obj){
				var n = 0;
				if (/object/.test(typeof(obj))) {
					$.each(obj, function(k, v){
						if (obj.hasOwnProperty(k)) n++;
					});
				} else if (/array/.test(typeof(obj))) {
					n = obj.length;
				}
				return n;
			},

			/**
			 * @function form
			 * @scope private
			 * @abstract Creates key/value pair object from form element
			 *
			 * @param {Object} obj The form object to convert
			 *
			 * @returns {Object}
			 */
			form: function(o, obj){

				(o.debug) ? _log.debug(o.appID, '_libs.form: Retrieving form data') : false;

				var _obj = {};
				$.each(obj, function(k, v){
					$.each(v, function(kk, vv){
						if ((vv.name) && (vv.value)){
							_obj[vv.name] = (/checkbox|radio/.test(vv.type)) ? _libs.selected(o, vv) : vv.value;
						}
					});
				});

				(o.debug) ? _libs.inspect(o, _obj) : false;

				return (/object/.test(typeof(_obj))) ? JSON.stringify(_obj) : _obj;
			},

			/**
			 * @function selected
			 * @scope private
			 * @abstract Return array of checked checkboxes or selected radio elements
			 *
			 * @param {Object} obj The checkbox or radio button
			 *
			 * @return {Array}
			 */
			selected: function(o, obj){
                var _r = [];
				var _a = $('#'+obj.name+':checked').map(function(){
					return this.value;
				}).get();
                $.each(_a, function(a, b){
                    if ($.inArray(b, _r) === -1) _r.push(b);
                });
                return _r;
            },

			/**
			 * @function guid
			 * @scope private
			 * @abstract Creates a random GUID (RFC-4122) identifier
			 *
			 * @param {Object} o Global options
			 *
			 * @returns {String}
			 */
			guid: function(o){
				var chars = '0123456789abcdef'.split('');
				var uuid = [], rnd = Math.random, r;
				uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
				uuid[14] = '4';
				for (var i = 0; i < 36; i++){
					if (!uuid[i]){
						r = 0 | rnd()*16;
						uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
					}
				}
				return uuid.join('');
			}
		};

		/**
		 * @method _log
		 * @scope private
		 * @abstract Logging methods for
		 *  - debug
		 *  - info
		 *  - warn
		 *  - error
		 */
		var _log = _log || {

			/**
			 * @function init
			 * @scope private
			 * @abstract Create console object for those without dev tools
			 *
			 * @returns {Boolean}
			 */
			init: function(){
				if (typeof(console) === 'undefined') {
					var console = {};
					console.log = console.error = console.info = console.debug = console.warn = function() {};
					return console;
				}
				return false;
			},

			/**
			 * @function debug
			 * @scope private
			 * @abstract Debugging _log function
			 *
			 * @param {String} i The application ID associated with implementation
			 * @param {String} t The message string to be rendered
			 *
			 * @returns {Boolean}
			 */
			debug: function(i, t){
				(typeof(console.debug) === 'function') ? console.debug('['+i+'] (DEBUG) '+t) : _log.spoof(i, 'DEBUG', t);
				return true;
			},

			/**
			 * @function info
			 * @scope private
			 * @abstract Information _log function
			 *
			 * @param {String} i The application ID associated with implementation
			 * @param {String} t The message string to be rendered
			 *
			 * @returns {Boolean}
			 */
			info: function(i, t){
				(typeof(console.info) === 'function') ? console.info('['+i+'] (INFO) '+t) : _log.spoof(i, 'INFO', t);
				return true;
			},

			/**
			 * @function warn
			 * @scope private
			 * @abstract Warning _log function
			 *
			 * @param {String} i The application ID associated with implementation
			 * @param {String} t The message string to be rendered
			 *
			 * @returns {Boolean}
			 */
			warn: function(i, t){
				(typeof(console.warn) === 'function') ? console.warn('['+i+'] (WARN) '+t) : _log.spoof(i, 'WARN', t);
				return true;
			},

			/**
			 * @function error
			 * @scope private
			 * @abstract Error _log function
			 *
			 * @param {String} i The application ID associated with implementation
			 * @param {String} t The message string to be rendered
			 *
			 * @returns {Boolean}
			 */
			error: function(i, t){
				console = this.init();
				(typeof(console.error) === 'function') ? console.error('['+i+'] (ERROR) '+t) : _log.spoof(i, 'ERROR', t);
				return true;
			},

			/**
			 * @function spoof
			 * @scope private
			 * @abstract Spoof console.log in the event it does not exist
			 *
			 * @param {String} t The message string to be rendered
			 *
			 * @returns {Boolean}
			 */
			spoof: function(i, l, t){
				window.log = function(i, l, t) {
					return this.log('['+i+'] ('+l+') '+t);
				}
			}
		};

		/* Robot, do work */
		if (methods[method]){
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if ((typeof method==='object')||(!method)){
			return methods.init.apply(this, arguments);
		} else {
			_log.error('Method '+method+' does not exist');
		}
		return true;
	};
})(jQuery);