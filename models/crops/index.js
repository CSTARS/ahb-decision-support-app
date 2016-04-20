var pg = require('../../lib/pg');
var md5 = require('md5');
var fs = require('fs');

var fips = {
  '06' : 'California',
  '16' : 'Idaho',
  '30' : 'Montana',
  '53' : 'Washington',
  '41' : 'Oregon'
};

module.exports = function() {
  return {
    getCrops : getCrops,
    getPriceAndYield : getPriceAndYield
  };
};

function getCrops(geometryCollection, callback) {
  var result = [];

  pg.willowClient().query('select cdl.land_cover_yield($1)', [JSON.stringify(geometryCollection)], function(err, resp){
    if( err ) {
      console.log(err);
      //fs.writeFileSync('tmp.json', JSON.stringify(geometryCollection));
      return callback(err);
    }

    if( resp.rows && resp.rows.length > 0 && resp.rows[0].land_cover_yield )  {
      callback(null, formatReponse(resp.rows[0], geometryCollection.geometries));
    } else {
      callback(null, []);
    }
  });
}

function getPriceAndYield(query, callback) {
  pg.willowClient().query('select * from swap.yields($1::jsonb);', [JSON.stringify(query)], function(err, resp){
    if( err ) {
      console.log(err);
      return callback(err);
    }

    if( resp.rows && resp.rows.length > 0 )  {
      callback(null, resp.rows[0].yields);
    } else {
      callback(null, []);
    }
  });
}

function formatReponse(data, geoms) {
  data.land_cover_yield.forEach(row => {
    row.state = fips[row.fips.substring(0,2)];
  });

  var resp = data.land_cover_yield;

  var notFound = 0;
  var duplicates = 0;

  var lookup = {};
  resp.forEach(function(item){
    if( lookup[item.id] ) {
      duplicates++;
    } else {
      lookup[item.id] = item;
    }
  });

  geoms.forEach(function(geom){
    // var id = md5(JSON.stringify({type: geom.type, coordinates: geom.coordinates}));
    var id = md5(JSON.stringify(geom));
    if( !lookup[id] ) {
      notFound++;
    }
  });

  console.log('notFound='+notFound+' duplicates='+duplicates);

  return resp;
}
