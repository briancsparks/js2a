
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

  handler.blankLine = function(level, name, item) {
    result.push("");
  };

  handler.singleLine = function(level, name, item) {
    result.push(indent(level, item.join(' ')+';'));
  };

  handler.comment = function(level, name, item) {
    result.push("");
    result.push(indent(level, '# '+item));
  };

  handler.listenSsl = function(level, name, item) {
    each(level, item, handleItem);
  };

  handler.block = function(level, name, item) {
    each(level, item, handleItem);
  };

  handler.location = function(level, name, item_) {
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

  //json.push('# vim: filetype=nginx:');
  json.push({comment:'vim: filetype=nginx:'});
  json.push({blankLine:[]});
  json = json.concat(ngxJson);
  each(0, json, handleItem);

  return result.join('\n');
};

// TODO: this is no longer needed
nginx.write.rootX = function(obj_) {
  var obj    = sg.deepCopy(obj_);
  var result = [];
  var level = 0;

  obj = simple(obj, level, result, 'worker_processes');

  obj = helpers.extract(obj, 'events', function(events_) {
    var events = events_;
    result.push(indent(level, 'events {'));                                                   // }

    level += 1;
    events = simple(events, level, result, 'worker_connections');
    level -= 1;

    if (events.length > 0) { console.error('events remainder', events); }

    result.push(indent(level, '}'));
  });

  obj = helpers.extract(obj, 'http', function(http_) {
    var http = http_;
    result.push(indent(level, 'http {'));                                                   // }

    level += 1;
    http = simple(http, level, result, 'include');
    http = simple(http, level, result, 'default_type');
    http = simple(http, level, result, 'client_body_temp_path');
    http = simple(http, level, result, 'client_max_body_size');
    http = simple(http, level, result, 'deny');
    http = simple(http, level, result, 'log_format');

    http = helpers.extract(http, 'server', function(server_) {
      var server = server_;
      result.push(indent(level, 'server {'));                                                   // }

      level += 1;
      server = simple(server, level, result, 'server_name');
      server = simple(server, level, result, 'root');
      server = simple(server, level, result, 'access_log');
      server = simple(server, level, result, 'listen');

      server = helpers.extract(server, 'listenSsl', function(listenSsl_) {
        var listenSsl = listenSsl_;

        listenSsl = simple(listenSsl, level, result, 'listen');
        listenSsl = simple(listenSsl, level, result, 'ssl_protocols');
        listenSsl = simple(listenSsl, level, result, 'ssl_ciphers');
        listenSsl = simple(listenSsl, level, result, 'ssl_certificate');
        listenSsl = simple(listenSsl, level, result, 'ssl_certificate_key');

        if (_.keys(listenSsl).length > 0) { console.error('listenSsl remainder', listenSsl); }

      });

      server = simple(server, level, result, 'include');

      server = helpers.extract(server, 'location', function(location_) {
        var location = location_;

        location = helpers.extract(location, 'loc', function(loc) {
          result.push(indent(level, 'location '+loc+' {'));                                                   // }
        });

        level += 1;
        location = helpers.extract(location, 'items', function(items_) {
          var items = items_;
          items = single(items, level, result, 'internal');
        });
        level -= 1;

        result.push(indent(level, '}'));
      });

      level -= 1;

      if (server.length > 0) { console.error('server remainder', server); }

      result.push(indent(level, '}'));
    });
    level -= 1;

    if (http.length > 0) { console.error('http remainder', http); }

    result.push(indent(level, '}'));
  });

  // Clear any empty items
  obj = _.filter(obj, function(item) { return item; });

  if (obj.length > 0) { console.error('result remainder', obj); }

  result = result.concat(obj);
  result = result.join('\n');

  return result;
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
addSimpleSnake(nginx, 'listen');
addSingleWord(nginx, 'internal');

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
  var names = 'workerProcesses,include,defaultType,clientBodyTempPath,clientMaxBodySize,' +
              'deny,logFormat,serverName,root,accessLog,listen,listenSsl,internal,' +
              'comment,blankLine,singleLine';
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



_.each(nginx, function(value, key) {
  exports[key] = value;
});


