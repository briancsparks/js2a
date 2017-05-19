
var test = require('ava');

var js2a  = require('../js2a');

test(function(t) {
  var conf = js2a.js(function() {
    return [
      "worker_process 2;",
      ""
    ];
  });

  var file = js2a.file(conf);

  t.regex(file, /worker_process 2/);
});

test(function(t) {
  t.is(true, !false);
});


