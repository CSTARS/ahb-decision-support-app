var pg = require('pg');
var fs = require('fs');
var async = require('async');
var isValid = require('./isValid');

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

    //var createSQL = fs.readFileSync('./parcelCache.sql','utf-8')
    //client.query(createSQL, function() {
      cleanUp();
    //});
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

      client.query(`INSERT INTO parcel_cache (properties, geometry) VALUES ($1,  ST_makevalid(ST_SetSRID(ST_GeomFromGeoJSON('${geom}'), 4326)));`, [properties], (err) => {
          if( err ) {
            throw new Error(err);
          }
          c++;
          next();
      })
    },
    (err) => {
      client.query(`CREATE INDEX idxpid ON parcel_cache ((properties::json->>'id'));`, [properties], (err) => {
          if( err ) throw new Error(err);
          cleanUp();
      });
    }
  );
}

function cleanUp() {
  client.query(`select properties, ST_asGeoJSON(geometry) from parcel_cache where ST_GeometryType(geometry) != 'ST_Polygon' AND ST_GeometryType(geometry) != 'ST_MultiPolygon';`, (err, result) => {
      if( err ) {
        throw new Error(err);
      }

      var features = [];
      result.rows.forEach((item) => {
        var feature = {
          type : 'Feature',
          geometry : JSON.parse(item.st_asgeojson),
          properties : JSON.parse(item.properties)
        }
        if( isValid(feature) ) features.push(feature);
      });

      var c = 0;
      async.eachSeries(
        features,
        (parcel, next) => {

          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write('Cleaning up bad geometries %'+ Math.floor((c/features.length)*100));

          var geom = JSON.stringify(parcel.geometry);
          var properties = JSON.stringify(parcel.properties);

          client.query(`delete from parcel_cache where (properties::json->>'id')::text = '${parcel.properties.id}';`, (err) => {
            if( err ) console.error(err);

            client.query(`INSERT INTO parcel_cache (properties, geometry) VALUES ($1,  ST_makevalid(ST_SetSRID(ST_GeomFromGeoJSON('${geom}'), 4326)));`, [properties], (err) => {
                if( err ) {
                  throw new Error(err);
                }
                c++;
                next();
            })
          });
          
        },
        (err) => {
          console.log('\ndone');
          process.exit();
        }
      );



      
  });

}


connect();