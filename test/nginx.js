
var test  = require('ava');
var sg    = require('sgsg');
var _     = sg._;

var js2a  = require('../js2a');
var ng    = js2a.nginx;

test(function(t) {
  var confJson = [
    ng.workerProcesses(2),
    ng.events([
      ng.workerConnections(1024)
    ]),
    ng.http([
      ng.server([
        ng.accessLog('/var/log/nginx/hq.log', 'main'),
        ng.listen(80),
        ng.listenSsl(1443, {default:true}),
      ]),
    ]),
    ""
  ];

  var json = sg.deepCopy(confJson);

  var conf = js2a.to(confJson, ng);
  console.log(sg.inspect(json), '\n'+conf);

  t.not(conf.length, 0);
  t.notDeepEqual(_.filter(conf.split('\n'), function(line) {return line.match(/^  worker_connections 1024/);}), []);
  t.notDeepEqual(_.filter(conf.split('\n'), function(line) {return line.match(/^    access_log [/]var[/]log[/]nginx[/]hq[.]log main/);}), [], sg.inspect(conf.split('\n')));
});

test(function(t) {
  var confJson = [
    ng.workerProcesses(2),
    ng.events([
      ng.workerConnections(1024)
    ]),
    ng.http([
      ng.include('mime.types')
    ]),
    ""
  ];

  var conf = js2a.to(confJson, ng);

  t.not(conf.length, 0);
  t.notDeepEqual(_.filter(conf.split('\n'), function(line) {return line.match(/^  worker_connections 1024/);}), []);
  t.notDeepEqual(_.filter(conf.split('\n'), function(line) {return line.match(/^  include mime\.types/);}), [], sg.inspect(conf.split('\n')));
});

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
      ng.http([
        ng.logFormat('test', '"a" - "$foobar"')
      ]),
      ""
    ];
  });

  var file = ng.conf(conf);

  t.regex(file, /worker_processes 2/);
  t.regex(file, /log_format test .*[$]foobar/);
});

