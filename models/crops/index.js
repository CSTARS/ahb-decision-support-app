var async = require('async');
var pg = require('../../lib/pg');
var yields = require('./yields');
var fs = require('fs');
var extend = require('extend');
var md5 = require('md5');

var crops = ['Alfalfa Hay','Alfalfa Haylage','Barley','Beans, Dry Edible',
'Canola','Corn Grain','Corn Silage','Grass Hay','Grass Haylage','Lentils','Oats',
'Potatoes','Spring Wheat','Sugarbeets','Winter Wheat'];


// no yields: lentils, potatoes
// prices: 'Corn Grain','Corn Silage','Grass Hay','Grass Haylage','Alfalfa','Alfalfa Haylage'

var fips = {
  '06' : 'California',
  '16' : 'Idaho',
  '30' : 'Montana',
  '53' : 'Washington',
  '41' : 'Oregon'
};

var dataMap = {
  XX : {
    label : "Unknown",
  },
  GR : {
    label : "Grain",
    crops : ['Barley', 'Oats', 'Spring Wheat', 'Winter Wheat'],
    swap : true
  },
  RI : {
    label : "Rice"
  },
  CO : {
    label : "Cotton"
  },
  SB : {
    label : "Sugarbeets",
    swap : true
  },
  CN : {
    label : "Corn",
    crops : ["Corn Grain", "Corn Silage"],
    swap : true
  },
  DB : {
    label : "Beans, Dry Edible",
    swap : true
  },
  SA : {
    label : "Safflower"
  },
  FL : {
    label : "Other field crops"
  },
  AL : {
    label : "Alfalfa",
    crops : ['Alfalfa Hay','Alfalfa Haylage'],
    swap : true
  },
  PA : {
    label : "Pasture",
    crops : ['Grass Hay','Grass Haylage'],
    swap : true
  },
  TP : {
    label : "Tomato processing"
  },
  TF : {
    label : "Tomato fresh"
  },
  CU : {
    label : "Cucurbits"
  },
  OG : {
    label : "Onion & garlic"
  },
  PO : {
    label : "Potatoes",
    swap : true
  },
  TR : {
    label : "Truck_Crops_misc"
  },
  AP : {
    label : "Almond & pistacios"
  },
  OR : {
    label : "Orchard (deciduous)"
  },
  CS : {
    label : "Citrus & subtropical"
  },
  VI : {
    label : "Vineyards"
  },
  UR : {
    label : "Urban landscape"
  },
  RV : {
    label : "Riparian",
  },
  NV : {
    label : "Native vegetation"
  },
  WS : {
    label : "Water surface"
  },
  SO : {
    label : "Soil"
  }
};

module.exports = function() {
  return {
    getCrops : getCrops
  };
};

function getCrops(geometryCollection, callback) {
  var result = [];

  pg.willowClient().query('select cdl.land_cover_yield($1)', [JSON.stringify(geometryCollection)], function(err, resp){
    if( err ) {
      console.log(err);
      return callback(err);
    }

    if( resp.rows && resp.rows.length > 0 )  {

      callback(null, formatReponse(resp.rows[0], geometryCollection.geometries));
    } else {
      callback(null, []);
    }
  });
}

function formatReponse(data, geoms) {
  //console.log(data);
  data.land_cover_yield.forEach(row => {
    // row.swap = row.swap.map(code => {
    //   if( !dataMap[code] ) {
    //     code = 'XX';
    //   }
    //
    //   var item = extend(true, {}, dataMap[code]);
    //   if( !item.crops ) {
    //     item.crop = item.label;
    //   } else {
    //     item.crop = item.crops[Math.round(Math.random() * (item.crops.length-1))];
    //   }
    //
    //   return item;
    // });

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



function getCrop(geometry, result, next) {
  var p;

  var crop = Math.floor(Math.random()*crops.length);
  crop = crops[crop];

  try {
    if( geometry.type === 'Polygon' ) {
      p = geometry.coordinates[0][0];
    } else {
      p = geometry.coordinates[0][0][0];
    }
  } catch(e) {
    results.push({error: true, id: 1, message: e, crop: crop});
    return next();
  }

  pg.client().query(query, p, function(err, resp){
    if( err ) {
      result.push({error: true, id: 2, message: err, crop: crop});
    } else {
      resp = resp.rows[0];
      resp.crop = crop;

      checkCrop(resp, crop);

      var t = yields(resp.state, resp.crop);
      resp.yield = t.yield;
      resp.price = t.price;

      result.push(resp);
    }

    next();
  });
}

function checkCrop(resp) {
  while( resp.state === 'California' && (resp.crop === 'Lentils' || resp.crop === 'Canola') ) {
    var crop = Math.floor(Math.random()*crops.length);
    resp.crop = crops[crop];
  }
}
