
/**
 *
 */
var sg                = require('sgsg');
var _                 = sg._;
var helpers           = require('./helpers');
var path              = require('path');

var indent            = helpers.indent;
var simple            = helpers.simple;
var single            = helpers.single;
var addSimpleSnake    = helpers.addSimpleSnake;
var addSingleWord     = helpers.addSingleWord;
var ensureFn          = helpers.ensureFn;
var each              = helpers.each;

var onOff;

var nginx = {
  write: {}
};

nginx.write.root = function(ngxJson) {

  var result = [];

  var handler = {};
  var handleItem = function(level, name, item) {
    if (name in handler) {
      return handler[name](level, name, item);
    } else {
      if (_.isString(item)) {
        result.push(indent(level, [name, item].join(' ')+';'));
      } else if (_.isObject(item)) {
        result.push(indent(level, name+' {'));             // }
        each(level+1, item, handleItem);
        result.push(indent(level, '}'));
      } else {
        result.push(indent(level, name+';'));
      }
    }
  };

  handler.blankLine = handler.blank_line = function(level, name, item) {
    result.push("");
  };

  handler.singleLine = handler.single_line = function(level, name, item) {
    result.push(indent(level, item.join(' ')+';'));
  };

  handler.comment = function(level, name, item) {
    result.push("");
    result.push(indent(level, '# '+item));
  };

  handler.proxy_redirect = function(level, name, item) {
    result.push(indent(level, [name, onOff(item)].join(' ')+';'));
  };

  handler.listenSsl = function(level, name, item) {
    result.push("");
    each(level, item, handleItem);
  };

  handler.block = function(level, name, item) {
    each(level, item, handleItem);
  };

  handler.location = function(level, name, item_) {
    result.push("");
    var item = helpers.extract(item_, 'loc', function(loc) {
      result.push(indent(level, 'location '+loc+' {'));                                                   // }
    });

    item = helpers.extract(item, 'items', function(items_) {
      var items = items_;
      each(level+1, items, handleItem);
    });

    result.push(indent(level, '}'));
  };

  var json = [];

  json.push({comment:'vim: filetype=nginx:'});
  json.push({blankLine:[]});
  json = json.concat(ngxJson);
  each(0, json, handleItem);

  return result.join('\n');
};


//------------------------------------------------------------
nginx.block = function(x) {
  if (_.isFunction(x)) {
    return {block: x()};
  }
  return {block:x};
};

nginx.events = function(x) {
  if (_.isFunction(x)) {
    return {events: x()};
  }
  return {events:x};
};

nginx.http = function(x) {
  if (_.isFunction(x)) {
    return {http: x()};
  }
  return {http:x};
};

nginx.server = function(x) {
  if (_.isFunction(x)) {
    var fn = x;
    var items = fn();
    return ["server {", items, "}"];
  }
  return {server:x};
};

nginx.location = function(loc, x) {
  if (_.isFunction(x)) {
    var fn = x;
    var items = fn();
    return ["location {", items, "}"];
  }
  return {location : {loc: loc, items: x}};
};

//------------------------------------------------------------
addSimpleSnake(nginx, 'set');
addSimpleSnake(nginx, 'user');
addSimpleSnake(nginx, 'worker-connections');
addSimpleSnake(nginx, 'worker-processes');
addSimpleSnake(nginx, 'comment');
addSimpleSnake(nginx, 'blankLine');

nginx.singleLine = function() {
  return {singleLine: _.toArray(arguments)};
};

// http
addSimpleSnake(nginx, 'include');
addSimpleSnake(nginx, 'default-type');
addSimpleSnake(nginx, 'client-body-temp-path');
addSimpleSnake(nginx, 'client-max-body-size');
addSimpleSnake(nginx, 'deny');

nginx.logFormat = function(name, value) {
  return {log_format: [name, "'"+value+"'"].join(' ')};
};

// server
addSimpleSnake(nginx, 'server-name');
addSimpleSnake(nginx, 'root');
addSimpleSnake(nginx, 'access-log');
addSimpleSnake(nginx, 'try-files');
addSimpleSnake(nginx, 'listen');

nginx.listenSsl = function(port_, options_) {
  var options       = options_ || {};
  var result        = {};

  var listen        = [port_ || options.port || 443, 'ssl'];
  if (options.default) {
    listen.push("default");
  }

  result.listen               = listen.join(' ');
  result.ssl_protocols        = (options.sslProtocols || ['TLSv1', 'TLSv1.1', 'TLSv1.2']).join(' ');
  result.ssl_ciphers          = (options.sslCiphers   || ['HIGH', '!aNULL', '!MD5']).join(':');
  result.ssl_certificate      = options.sslCertificate;
  result.ssl_certificate_key  = options.sslCertificateKey;

  if (!result.ssl_certificate) {
    options.sslDir          = options.sslDir || path.join(process.env.HOME, 'tmp', 'nginx', 'certs');
    result.ssl_certificate  = path.join(options.sslDir, options.fqdn || 'server')+'.crt';
  }

  if (!result.ssl_certificate_key) {
    options.sslDir              = options.sslDir || path.join(process.env.HOME, 'tmp', 'nginx', 'certs');
    result.ssl_certificate_key  = path.join(options.sslDir, options.fqdn || 'server')+'.key';
  }

  return {listenSsl: result};
};

// location
addSingleWord(nginx, 'internal');
addSimpleSnake(nginx, 'proxy-connect-timeout');
addSimpleSnake(nginx, 'proxy-send-timeout');
addSimpleSnake(nginx, 'proxy-read-timeout');
addSimpleSnake(nginx, 'send-timeout');
addSimpleSnake(nginx, 'proxy-redirect');
addSimpleSnake(nginx, 'proxy-set-header');
addSimpleSnake(nginx, 'proxy-http-version');
addSimpleSnake(nginx, 'proxy-method');
addSimpleSnake(nginx, 'proxy-pass');

//------------------------------------------------------------
nginx.conf = function(obj) {
  return nginx.write.root(obj);
};

//------------------------------------------------------------

/**
 *  c-tor for Nginx object.
 */
nginx.Nginx = function() {
  var self    = this;

  self.payload = [];

  self.conf = function(fn_) {
    var fn      = ensureFn(fn_);
    var config  = nginx.conf(fn(this));

    return config;
  };

  self.json = function(fn_) {
    var fn      = ensureFn(fn_);

    self.payload = fn(this);
    return self.payload;
  };

  self.conf2 = function(fn_) {
    return nginx.write.root(self.json(fn_));
  };

  self.block = function(fn_) {
    var fn = ensureFn(fn_);
    return {block: fn(this)};
  };

  self.events = function(fn_) {
    var fn = ensureFn(fn_);
    return {events: fn(this)};
  };

  self.http = function(fn_) {
    var fn = ensureFn(fn_);
    return {http: fn(this)};
  };

  self.server = function(fn_) {
    var fn = ensureFn(fn_);
    return {server: fn(this)};
  };

  self.location = function(loc, fn_) {
    var fn = ensureFn(fn_);
    return {location : {loc: loc, items: fn(this)}};
  };

  self.workerConnections = function(fn_) {
    var fn = ensureFn(fn_);
    return nginx.workerConnections(fn(this));
  };

  // Copy all the stuff from nginx that makes sense here
  var names = 'user,workerProcesses,include,defaultType,clientBodyTempPath,clientMaxBodySize,' +
              'deny,logFormat,serverName,root,accessLog,listen,listenSsl,internal,tryFiles' +
              'comment,blankLine,singleLine,set,proxyConnectTimeout,proxySendTimeout,proxyReadTimeout,' +
              'sendTimeout,proxyRedirect,proxySetHeader,proxyHttpVersion,proxyMethod,proxyPass';
  _.each(names.split(','), function(name) {
    self[name] = function(fn_) {
      var fn      = ensureFn(fn_);
      var result  = fn(this);

      if (!_.isArray(result)) {
        result = [result];
      }

      return nginx[name].apply(this, result);
    };
  });

};

onOff = function(x) {
  if (x === 'on')     { return 'on'; }
  if (x === true)     { return 'on'; }
  if (x === 'true')   { return 'on'; }

  if (x === 'off')    { return 'off'; }
  if (x === false)    { return 'off'; }
  if (x === 'false')  { return 'off'; }

  return 'off';
};

_.each(nginx, function(value, key) {
  exports[key] = value;
});


