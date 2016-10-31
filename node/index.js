'use strict';

/**
 * Module dependencies.
 */

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _parseRedisUrl = require('parse-redis-url');

var _parseRedisUrl2 = _interopRequireDefault(_parseRedisUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Module constants.
 */

var parse = (0, _parseRedisUrl2.default)(_redis2.default).parse;
var noop = function noop() {};

var RedisStore = (function () {

  /**
   * RedisStore constructor.
   *
   * @param {String|Object} options
   * @api public
   */

  function RedisStore() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, RedisStore);

    var _options = options;
    var port = _options.port;
    var host = _options.host;
    var client = _options.client;
    var setex = _options.setex;
    var password = _options.password;
    var database = _options.database;
    var prefix = _options.prefix;

    if ('string' === typeof options) {
      options = parse(options);
    }

    if ('function' === typeof setex) {
      this.client = options;
    } else if (client) {
      this.client = client;
    } else if (!port && !host) {
      this.client = new _redis2.default.createClient();
    } else {
      this.client = new _redis2.default.createClient(port, host, _extends({}, options, { prefix: null }));
    }

    if (password) {
      this.client.auth(password, function (err) {
        if (err) throw err;
      });
    }

    if (database) {
      this.client.select(database, function (err) {
        if (err) throw err;
      });
    }

    this.prefix = prefix || 'cacheman:';
  }

  /**
   * Get an entry.
   *
   * @param {String} key
   * @param {Function} fn
   * @api public
   */

  _createClass(RedisStore, [{
    key: 'get',
    value: function get(key) {
      var fn = arguments.length <= 1 || arguments[1] === undefined ? noop : arguments[1];

      var k = '' + this.prefix + key;
      this.client.get(k, function (err, data) {
        if (err) return fn(err);
        if (!data) return fn(null, null);
        data = data.toString();
        try {
          fn(null, JSON.parse(data));
        } catch (e) {
          fn(e);
        }
      });
    }

    /**
     * Set an entry.
     *
     * @param {String} key
     * @param {Mixed} val
     * @param {Number} ttl
     * @param {Function} fn
     * @api public
     */

  }, {
    key: 'set',
    value: function set(key, val, ttl) {
      var fn = arguments.length <= 3 || arguments[3] === undefined ? noop : arguments[3];

      var k = '' + this.prefix + key;

      if ('function' === typeof ttl) {
        fn = ttl;
        ttl = null;
      }

      try {
        val = JSON.stringify(val);
      } catch (e) {
        return fn(e);
      }

      var cb = function cb(err) {
        if (err) return fn(err);
        fn(null, val);
      };

      if (-1 === ttl) {
        this.client.set(k, val, cb);
      } else {
        this.client.setex(k, ttl || 60, val, cb);
      }
    }

    /**
     * Delete entry. Supported glob-style patterns.
     *
     * @param {String} key
     * @param {Function} fn
     * @api private
     */

  }, {
    key: '_del',
    value: function _del(key) {
      var _this = this;

      var fn = arguments.length <= 1 || arguments[1] === undefined ? noop : arguments[1];

      this.client.keys(key, function (err, data) {
        if (err) return fn(err);
        var count = data.length;
        if (count === 0) return fn(null, null);
        data.forEach(function (key) {
          _this.client.del(key, function (err, data) {
            if (err) {
              count = 0;
              return fn(err);
            }
            if (--count == 0) {
              fn(null, null);
            }
          });
        });
      });
    }

    /**
     * Delete an entry (Supported glob-style patterns).
     *
     * @param {String} key
     * @param {Function} fn
     * @api public
     */

  }, {
    key: 'del',
    value: function del(key) {
      var fn = arguments.length <= 1 || arguments[1] === undefined ? noop : arguments[1];

      this._del('' + this.prefix + key, fn);
    }

    /**
     * Clear all entries for this key in cache.
     *
     * @param {String} key
     * @param {Function} fn
     * @api public
     */

  }, {
    key: 'clear',
    value: function clear() {
      var fn = arguments.length <= 0 || arguments[0] === undefined ? noop : arguments[0];

      this._del(this.prefix + '*', fn);
    }
  }]);

  return RedisStore;
})();

exports.default = RedisStore;
module.exports = exports['default'];