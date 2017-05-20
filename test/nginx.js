
var test      = require('ava');
var sg        = require('sgsg');
var _         = sg._;
var helpers   = require('./_helpers');

var js2a      = require('../js2a');
var ng        = js2a.nginx;
var findLine  = helpers.findLine;

// TODO:
//  http.upstream
//  map

test('Can do one of each', function(t) {
  var confJson = [
    ng.workerProcesses(2),
    ng.events([
      ng.workerConnections(1024)
    ]),
    ng.http([
      ng.include('mime.types'),
      ng.defaultType('application/octet-stream'),
      ng.clientBodyTempPath('/var/tmp/nginx/client_body_temp'),
      ng.clientMaxBodySize('25M'),
      ng.deny('8.28.16.0/24'),
      ng.logFormat('test', '"a" - "$foobar"'),
      ng.server([
        ng.serverName('sub.example.com'),
        ng.root('/var/www/sub'),
        ng.accessLog('/var/log/nginx/hq.log', 'main'),
        ng.listen(80),
        ng.listenSsl(1443, {default:true}),
        ng.include('/etc/nginx/routes/sub.example.com'),
        ng.location('/nginx_status', [
          ng.internal()
        ])
      ]),
    ]),
    ""
  ];

  var json  = sg.deepCopy(confJson);

  var conf  = js2a.to(confJson, ng);
  var lines = conf.split('\n');

  console.error(conf);

  t.not(conf.length, 0);
  t.not(lines = findLine(lines, /^worker_processes 2;$/), false);
  t.not(lines = findLine(lines, /^events [{]$/), false);                                                              // }
  t.not(lines = findLine(lines, /^  worker_connections 1024;$/), false);
  t.not(lines = findLine(lines, /^http [{]$/), false);                                                                // }
  t.not(lines = findLine(lines, /^  include mime[.]types;$/), false);
  t.not(lines = findLine(lines, /^  default_type application[/]octet-stream;$/), false);
  t.not(lines = findLine(lines, /^  client_body_temp_path [/]var[/]tmp[/]nginx[/]client_body_temp;$/), false);
  t.not(lines = findLine(lines, /^  client_max_body_size 25M;$/), false);
  t.not(lines = findLine(lines, /^  deny 8[.]28[.]16[.]0[/]24;$/), false);
  t.not(lines = findLine(lines, /^  log_format test '"a" - "[$]foobar"';$/), false);
  t.not(lines = findLine(lines, /^  server [{]$/), false);                                                            // }
  t.not(lines = findLine(lines, /^    server_name sub[.]example[.]com;$/), false);
  t.not(lines = findLine(lines, /^    root [/]var[/]www[/]sub;$/), false);
  t.not(lines = findLine(lines, /^    access_log [/]var[/]log[/]nginx[/]hq[.]log main;$/), false);
  t.not(lines = findLine(lines, /^    listen 80;$/), false);
  t.not(lines = findLine(lines, /^    listen 1443 ssl default;$/), false);
  t.not(lines = findLine(lines, /^    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;$/), false);
  t.not(lines = findLine(lines, /^    ssl_ciphers HIGH:!aNULL:!MD5;$/), false);
  t.not(lines = findLine(lines, /^    ssl_certificate [/]Users[/]sparksb[/]tmp[/]nginx[/]certs[/]server.crt;$/), false);
  t.not(lines = findLine(lines, /^    ssl_certificate_key [/]Users[/]sparksb[/]tmp[/]nginx[/]certs[/]server.key;$/), false);
  t.not(lines = findLine(lines, /^    include [/]etc[/]nginx[/]routes[/]sub[.]example[.]com;$/), false);
  t.not(lines = findLine(lines, /^    location [/]nginx_status [{]$/), false);                                        // }
  t.not(lines = findLine(lines, /^      internal;$/), false);
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
