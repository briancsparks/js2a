
/**
 *
 */
var sg            = require('sgsg');
var _             = sg._;

var helpers = {};

//----------------------------------------------------------------------------------------------------
//------------- Helpers for writing .write.root ------------------------------------------------------
//----------------------------------------------------------------------------------------------------

/**
 *  Extracts each obj.name, and calls fn(obj.name).
 *
 *  Note that obj is probably an array, each element of the array is a one-item
 *  object.
 */
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

/**
 *  Finds obj.name and removes it from obj; then it writes the line:
 *
 *      snake_cased_name value;
 *
 *  For example:
 *
 *      client_max_body_size 10M;
 */
helpers.simple = function(obj, level, result, name) {
  return helpers.extract(obj, name, function(value) {
    result.push(indent(level, sg.toSnakeCase(name)+" "+value+";"));
  });
};

/**
 *  Finds obj.name and removes it from obj; then it writes the line:
 *
 *      snake_cased_name;
 *
 *  For example, in an nginx conf file, making a location `internal`.
 *
 *      location ...
 *        internal;
 */
helpers.single = function(obj, level, result, name) {
  return helpers.extract(obj, name, function(value) {
    result.push(indent(level, sg.toSnakeCase(name)+";"));
  });
};

//----------------------------------------------------------------------------------------------------
//------------- Helpers to write the functional interface --------------------------------------------
//----------------------------------------------------------------------------------------------------

/**
 *  Adds the camel-cased name as mod.name = function(...) ...
 *
 *  The function, when called, will add a one-line item like:
 *
 *      snake_case_name arg1 arg2 arg3;
 */
helpers.addSimpleSnake = function(mod, name) {
  mod[sg.toCamelCase(name)] = function(value) {
    return sg.kv(sg.toSnakeCase(name), _.toArray(arguments).join(' '));
  };
};

/**
 *  Adds the camel-cased name as mod.name = function(...) ...
 *
 *  The function, when called, will add a one-line item like:
 *
 *      snake_case_name;
 */
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

helpers.each = function(level, obj, fn) {
  if (_.isArray(obj)) {
    _.each(obj, function(item) {
      helpers.each(level, item, fn);
    });
    return;
  }

  if (_.isString(obj)) {
    fn(level, obj);
    return;
  }

  /* otherwise */
  _.each(obj, function(item, key) {
    fn(level, key, item);
  });
};

_.each(helpers, function(value, key) {
  exports[key] = value;
});


