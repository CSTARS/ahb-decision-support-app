var pg = require('pg');
var fs = require('fs');
var async = require('async');

var swConfig = {
  "host" : "localhost",
  "port" : 5434,
  "db" : "ahb",
  username : 'postgres'
  // host : 'localhost',
  // port : '5432'
}

var conString = `postgres://${swConfig.username}@${swConfig.host}:${swConfig.port}/${swConfig.db}`;
var client;

function connect() {

  pg.connect(conString, function(err, c, d) {
    if( err ) {
      throw new Error(err);
    }

    client = c;
    console.log('connected');

    var createSQL = fs.readFileSync('./parcelCache.sql','utf-8')
    client.query(createSQL, function() {
      read();
    });
  });
}

function read() {
  console.log('reading parcelCacheData.txt');
  var c = 0;
  var json = fs.readFileSync('./parcelCacheData.txt','utf-8').split('\n');

  async.eachSeries(
    json,
    (parcel, next) => {
      if( !parcel ) {
        return next();
      }

      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write('Writing parcels to PG %'+ Math.floor((c/json.length)*100));

      parcel = JSON.parse(parcel);
      if( parcel.geometry.bbox ) {
        delete parcel.geometry.bbox;
      }

      var geom = JSON.stringify(parcel.geometry);
      var properties = JSON.stringify(parcel.properties);

      client.query(`INSERT INTO parcel_cache (properties, geometry) VALUES ($1, ST_GeomFromGeoJSON('${geom}'));`, [properties], (err) => {
          if( err ) {
            throw new Error(err);
          }
          c++;
          next();
      }),
      (err) => {
        client.close();
        console.log('\ndone');
        process.exit();
      }
    }
  );

  // var lineReader = require('readline').createInterface({
  //   input: fs.createReadStream('./output.txt', 'utf-8')
  // });

  // lineReader.on('line', function (line) {
  //   client.query(''
  // });
}

connect();
//read();