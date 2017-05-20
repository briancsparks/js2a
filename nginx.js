
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

var nginx = {
  write: {}
};

nginx.write.root = function(obj_) {
  var obj    = sg.deepCopy(obj_);
  var result = [];
  var level = 0;

  obj = simple(obj, level, result, 'worker_processes');

  obj = helpers.extract(obj, 'events', function(events_) {
    var events = events_;
    result.push(indent(level, 'events {'));

    level += 1;
    events = simple(events, level, result, 'worker_connections');
    level -= 1;

    if (events.length > 0) { console.error('events remainder', events); }

    result.push(indent(level, '}'));
  });

  obj = helpers.extract(obj, 'http', function(http_) {
    var http = http_;
    result.push(indent(level, 'http {'));

    level += 1;
    http = simple(http, level, result, 'include');
    http = simple(http, level, result, 'default_type');
    http = simple(http, level, result, 'client_body_temp_path');
    http = simple(http, level, result, 'client_max_body_size');
    http = simple(http, level, result, 'deny');
    http = simple(http, level, result, 'log_format');

    http = helpers.extract(http, 'server', function(server_) {
      var server = server_;
      result.push(indent(level, 'server {'));

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
console.error('server', server);

      server = helpers.extract(server, 'location', function(location_) {
        var location = location_;

        location = helpers.extract(location, 'loc', function(loc) {
          result.push(indent(level, 'location '+loc+' {'));
        });

        level += 1;
        location = helpers.extract(location, 'items', function(items_) {
          var items = items_;
          items = single(items, level, result, 'internal');
        });
        level -= 1;

console.error('location', location);

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
nginx.events = function(x) {
  if (_.isFunction(x)) {
    var fn = x;
    var items = fn();
    return ["events {", items, "}"];
  }
  return {events:x};
};

nginx.http = function(x) {
  if (_.isFunction(x)) {
    var fn = x;
    var items = fn();
    return ["http {", items, "}"];
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
  var result = '';

  result += obj.join('\n');

  return result;
};

_.each(nginx, function(value, key) {
  exports[key] = value;
});


