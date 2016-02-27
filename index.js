'use strict';

var express = require('express');
var kraken = require('kraken-js');
var fs = require('fs');

var options, app;

options = {
    onconfig: function (config, next) {

        if( fs.existsSync('/etc/ahb-decision-support-app/config.json') ) {
          config.use(require('/etc/ahb-decision-support-app/config.json'));
        }

        // allow command line switch from serving /dist to /app
        if( config.get('dev') ) {
          var middleware = config.get('middleware').static;
          middleware.module.arguments[0] = middleware.module.arguments[0].replace(/dist$/,'app');
          console.log('Servering ./app');
        }

        next(null, config);
    }
};

app = express();
app.use(kraken(options));
app.on('start', function () {
    console.log('Application ready to serve requests.');
    console.log('Environment: %s', app.kraken.get('env:env'));
});

var http = require('http');
var server = http.createServer(app);
server.listen(process.env.PORT || 8000);
server.on('listening', function () {
    console.log('Server listening on http://localhost:%d', this.address().port);
});
