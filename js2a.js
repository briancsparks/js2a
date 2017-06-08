
/**
 *
 */
var sg            = require('sgsg');
var _             = sg._;

var js2a = {};

js2a.nginx = require('./nginx');

js2a.js = function(fn) {
  var items = fn(js2a);
  return _.flatten(items);
};

js2a.file = function(obj) {
  var result = '';

  result += obj.join('\n');

  return result;
};

js2a.to = function(obj, converter) {
  return converter.write.root(obj);
};

_.each(js2a, function(value, key) {
  exports[key] = value;
});

