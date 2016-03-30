var fs = require('fs');
var parse = require('csv-parse');

var prices = {};
var yields = {};

var fips = {
  'california' : 6,
  'idaho' : 16,
  'washington' : 53,
  'oregon' : 41
};


function prepare() {
  read(__dirname+'/commodity_avg_price.csv', function(err, rows){
    rows.splice(0, 1);
    rows.forEach(function(data) {
      prices[parseInt(data[0])+data[1].toLowerCase()] = {
        value : parseFloat(data[2]),
        units : data[3],
      };
    });
  });

  read(__dirname+'/commodity_yield.csv', function(err, rows){
    rows.splice(0, 1);
    rows.forEach(function(data) {
      var id = parseInt(data[1])+data[0].toLowerCase();
      var units = data[3];

      var yd;
      for( var i = 4; i < data.length; i++ ) {
        if( data[i] !== '' ) {
          yd = parseFloat(data[i]);
          break;
        }
      }

      yields[id] = {
        value : yd,
        units : units
      };
    });
  });
}

function read(file, callback) {
  var input = fs.readFileSync(file, 'utf-8');
  parse(input, {comment: '#'}, callback);
}

prepare();

module.exports = function(state, crop) {
  state = fips[state.toLowerCase()];
  var t = {
    yield : yields[state+crop.toLowerCase()],
    price : prices[state+crop.toLowerCase()]
  };
  return t;
};
