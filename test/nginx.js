
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

test('Nginx can do one of each', function(t) {

  var blk;

  var ngx   = new ng.Nginx();
  var theNginx = function(ngx) {
    return [
      ngx.workerProcesses(function(ngx) { return 2; }),
      ngx.events(function(ngx) {
        return ngx.workerConnections(function(ngx) { return 1024; });
      }),
      ngx.http(function(ngx) {
        return [
          ngx.include(function(ngx)             { return 'mime.types'; }),
          ngx.defaultType(function(ngx)         { return 'application/octet-stream'; }),

          blk = ngx.block(function(ngx) {
            return [
              ngx.clientBodyTempPath(function(ngx)  { return '/var/tmp/nginx/client_body_temp'; }),
              ngx.clientMaxBodySize(function(ngx)   { return '25M'; })
            ];
          }),

          ngx.deny(function(ngx)                { return '8.28.16.0/24'; }),
          ngx.logFormat(function(ngx)           { return ['test', '"a" - "$foobar"']; }),

          ng.singleLine('a', 'silly', 'item'),
          ngx.singleLine(function(ngx)          { return ['a', 'silly', 'item', 2]; }),

          ng.comment('Here are the servers'),
          ngx.server(function(ngx) {
            return [
              ngx.serverName(function(ngx)      { return 'sub.example.com'; }),
              ngx.root(function(ngx)            { return '/var/www/sub'; }),
              ngx.accessLog(function(ngx)       { return ['/var/log/nginx/hq.log', 'main']; }),
              ngx.listen(function(ngx)          { return 80; }),
              ngx.listenSsl(function(ngx)       { return [1443, {default: true}]; }),
              ngx.include(function(ngx)         { return '/etc/nginx/routes/sub.example.com'; }),

              ngx.location('/nginx_status', function(ngx) {
                return [
                  ngx.internal(function(ngx)    { return; }),
                  ng.proxyConnectTimeout(5000),
                  ng.proxySendTimeout(5000),
                  ng.proxyReadTimeout(5000),
                  ng.sendTimeout(5000),
                  ng.proxyRedirect(false),
                  ng.proxySetHeader('X-Real-IP', '$remote_addr'),
                  ng.proxySetHeader('Connection', ''),
                  ng.proxyHttpVersion('1.1'),
                  ng.proxyMethod('HEAD'),
                  ng.set('$other_uri', '$1'),
                  ng.proxyPass('http://$other_uri')
                ];
              })
            ];
          })
        ];
      })
    ];
  };

  var obj = ngx.json(theNginx);
  blk.block.push(ng.deny('2.3.4.5/32'));
  var conf = ng.write.root(obj);

  console.error(conf);

  var lines = conf.split('\n');

  t.not(conf.length, 0);
  t.not(lines = findLine(lines, /^worker_processes 2;$/), false);
  t.not(lines = findLine(lines, /^events [{]$/), false);                                                              // }
  t.not(lines = findLine(lines, /^  worker_connections 1024;$/), false);
  t.not(lines = findLine(lines, /^http [{]$/), false);                                                                // }
  t.not(lines = findLine(lines, /^  include mime[.]types;$/), false);
  t.not(lines = findLine(lines, /^  default_type application[/]octet-stream;$/), false);
  t.not(lines = findLine(lines, /^  client_body_temp_path [/]var[/]tmp[/]nginx[/]client_body_temp;$/), false);
  t.not(lines = findLine(lines, /^  client_max_body_size 25M;$/), false);
  t.not(lines = findLine(lines, /^  deny 2[.]3[.]4[.]5[/]32;$/), false);
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
  t.not(lines = findLine(lines, /^      proxy_connect_timeout 5000;$/), false);
  t.not(lines = findLine(lines, /^      proxy_send_timeout 5000;$/), false);
  t.not(lines = findLine(lines, /^      proxy_read_timeout 5000;$/), false);
  t.not(lines = findLine(lines, /^      send_timeout 5000;$/), false);
  t.not(lines = findLine(lines, /^      proxy_redirect off;$/), false);
  t.not(lines = findLine(lines, /^      proxy_set_header X-Real-IP [$]remote_addr;$/), false);
  t.not(lines = findLine(lines, /^      proxy_set_header Connection "";$/), false);
  t.not(lines = findLine(lines, /^      proxy_http_version 1.1;$/), false);
  t.not(lines = findLine(lines, /^      proxy_method HEAD;$/), false);
  t.not(lines = findLine(lines, /^      set [$]other_uri [$]1;$/), false);
  t.not(lines = findLine(lines, /^      proxy_pass http:[/][/][$]other_uri;$/), false);
});

test('Nginx can combine functions with non-functions', function(t) {

  var ngx   = new ng.Nginx();
  var conf  = ngx.conf(function(ngx) {
    return ngx.events(function(ngx) {
      return ng.workerConnections(1024);
    });
  });

  var lines = conf.split('\n');

  t.not(conf.length, 0);
  t.not(lines = findLine(lines, /^events [{]$/), false);                                                              // }
  t.not(lines = findLine(lines, /^  worker_connections 1024;$/), false);
});

test('Nginx can use functions', function(t) {

  var ngx   = new ng.Nginx();
  var conf  = ngx.conf(function(ngx) {
    return ngx.events(function(ngx) {
      return ngx.workerConnections(function(ngx) {
        return 1024;
      });
    });
  });

  var lines = conf.split('\n');

  t.not(conf.length, 0);
  t.not(lines = findLine(lines, /^events [{]$/), false);                                                              // }
  t.not(lines = findLine(lines, /^  worker_connections 1024;$/), false);
});


test('Can do multiple servers', function(t) {
  var confJson = [
    ng.http([
      ng.server([
        ng.serverName('sub.example.com'),
      ]),
      ng.server([
        ng.serverName('sub2.example.com'),
      ])
    ]),
    ""
  ];

  var json  = sg.deepCopy(confJson);

  var conf  = js2a.to(confJson, ng);
  var lines = conf.split('\n');

  t.not(conf.length, 0);
  t.not(lines = findLine(lines, /^http [{]$/), false);                                                                // }
  t.not(lines = findLine(lines, /^  server [{]$/), false);                                                            // }
  t.not(lines = findLine(lines, /^    server_name sub[.]example[.]com;$/), false);
  t.not(lines = findLine(lines, /^  server [{]$/), false);                                                            // }
  t.not(lines = findLine(lines, /^    server_name sub2[.]example[.]com;$/), false);
});

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

//  console.error(conf);

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

