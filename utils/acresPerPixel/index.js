var async = require('async');
var pg = require('pg');
var path = require('path');
var fs = require('fs');
var query = require('./query');

var maxX = 112;
var maxY = 160;
var pixels = [];
for( var i = 1; i <= maxX; i++ ) {
  for( var j = 0; j <= maxY; j++ ) pixels.push([i,j]);
}

var stream = fs.createWriteStream(path.join(__dirname, 'results.txt'))

var swConfig = {
  "host" : "localhost",
  "port" : 5434,
  "db" : "ahb",
  username : 'postgres'
}

var conString = `postgres://${swConfig.username}@${swConfig.host}:${swConfig.port}/${swConfig.db}`;
var client;
var errors = [];

function connect() {

  pg.connect(conString, function(err, c, d) {
    if( err ) {
      throw new Error(err);
    }

    client = c;
    console.log('connected');
    run();
  });
}

function run() {
  var c = 0;
  async.eachSeries(
    pixels,
    (px, next) => {

      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Completed ${px[0]},${px[1]} %`+ Math.floor((c/pixels.length)*100));

      client.query(query(px[0], px[1]), (err, result) => {
          if( err ) errors.push(px);
          else if( result.rows.length > 0 ) stream.write(JSON.stringify(result.rows[0])+'\n');
          next();
      });
    },
    (err) => {
      stream.end();
      console.log(errors);
      console.log('done');
      process.exit();
    }
  );
}

connect();