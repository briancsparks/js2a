
/**
 *
 */
var sg            = require('sgsg');
var _             = sg._;
var helpers       = require('./helpers');

var indent        = helpers.indent;

var nginx = {
  write: {}
};

nginx.write.root = function(obj_) {
  var obj    = obj_;
  var result = [];
  var level = 0;

  obj = helpers.extract(obj, 'worker_processes', function(count) {
    result.push(indent(level, "worker_processes "+count+";"));
  });

  obj = helpers.extract(obj, 'events', function(events_) {
    result.push(indent(level, 'events {'));

    level += 1;
    var events = helpers.extract(events_, 'worker_connections', function(count) {
      result.push(indent(level, "worker_connections "+count+";"));
    });
    level -= 1;

    result.push(indent(level, '}'));
  });

  result = result.concat(obj);
  result = result.join('\n');

  return result;
};


nginx.events = function(x) {
  if (_.isFunction(x)) {
    var fn = x;
    var items = fn();
    return ["events {", items, "}"];
  }
  return {events:x};
};

nginx.workerConnections = function(count) {
  return {worker_connections:count};
//  return "  worker_connections "+count+";";
};

nginx.workerProcesses = function(count) {
  return {worker_processes:count};
//  return "worker_process "+count+";";
};

nginx.conf = function(obj) {
  return nginx.write.root(obj);
  var result = '';

  result += obj.join('\n');

  return result;
};

_.each(nginx, function(value, key) {
  exports[key] = value;
});


