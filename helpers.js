
/**
 *
 */
var sg            = require('sgsg');
var _             = sg._;

var helpers = {};

helpers.extract = function(obj, name, fn) {

  var remainder = [];
  if (_.isArray(obj)) {

    _.each(obj, function(item_) {
      var item = item_;
      if (_.isString(item) && item === name)  { fn(item); return; }
      if (!sg.isObject(item))                 { remainder.push(item); return; }

      /* otherwise */
      item = helpers.extract(item, name, fn);
      if (sg.numKeys(item) > 0) {
        remainder.push(item);
      }
    });

    return remainder;
  }

  /* otherwise */
  var item = obj[name];
  delete obj[name];
  if (item) {
    fn(item);
  }
  return obj;
};

var indent = helpers.indent = function(level, str) {
  var result = '';
  var i;
  for (i = 0; i < level; ++i) {
    result += '  ';
  }
  result += str;
  return result;
};

helpers.simple = function(obj, level, result, name) {
  return helpers.extract(obj, name, function(value) {
    result.push(indent(level, sg.toSnakeCase(name)+" "+value+";"));
  });
};

helpers.single = function(obj, level, result, name) {
  return helpers.extract(obj, name, function(value) {
    result.push(indent(level, sg.toSnakeCase(name)+";"));
  });
};

helpers.addSimpleSnake = function(mod, name) {
  mod[sg.toCamelCase(name)] = function(value) {
    return sg.kv(sg.toSnakeCase(name), _.toArray(arguments).join(' '));
  };
};

helpers.addSingleWord = function(mod, name) {
  mod[sg.toCamelCase(name)] = function() {
    return sg.toSnakeCase(name);
  };
};

var noop = function(x) {
  if (sg.isnt(x)) { return {}; }
  return x;
};

helpers.ensureFn = function(fn) {
  if (sg.isnt(fn))        { return noop; }
  if (!_.isFunction(fn))  { return noop; }
  return fn;
};

_.each(helpers, function(value, key) {
  exports[key] = value;
});


