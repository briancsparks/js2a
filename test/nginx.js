
var test  = require('ava');
var _     = require('sgsg')._;

var js2a  = require('../js2a');
var ng    = js2a.nginx;

test(function(t) {
  var confJson = [
    ng.workerProcesses(2),
    ng.events([
      ng.workerConnections(1024)
    ]),
    ""
  ];

  var conf = js2a.to(confJson, ng);

  t.not(conf.length, 0);
  t.notDeepEqual(_.filter(conf.split('\n'), function(line) {return line.match(/^  worker_connections 1024/);}), []);
});

test(function(t) {
  var conf = js2a.js(function() {
    return [
      ng.workerProcesses(2),
      ""
    ];
  });

  var file = ng.conf(conf);

  t.regex(file, /worker_processes 2/);
});

