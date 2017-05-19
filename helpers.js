
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
      if (!sg.isObject(item)) { remainder.push(item); return; }

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

helpers.indent = function(level, str) {
  var result = '';
  var i;
  for (i = 0; i < level; ++i) {
    result += '  ';
  }
  result += str;
  return result;
};

_.each(helpers, function(value, key) {
  exports[key] = value;
});


