
/**
 *
 */
var sg                = require('sgsg');
var _                 = sg._;

var helpers = {};

/**
 *  Within a list of strings (like lines of a file), find the line that contains
 *  the regexp. Return that line and all the rest.
 *
 *  This allows you to write tests that verify a lot of a file easily.
 *
 *  Returns the remainder list, or false if the list is empty.
 */
helpers.findLine = function(lines, rxp) {

  // To allow easy calling, `lines` can be false
  if (lines === false) { return false; }

  var found = false;
  var result = _.filter(lines, function(line) {
    if (found) { return true; }
    return (found = !!line.match(rxp));
  });

  return result.length > 0 ? result : false;
};

_.each(helpers, function(value, key) {
  exports[key] = value;
});


