var read = require('./read');
var update = require('./updateFB');
var fips = require('./fips');

module.exports = function() {
  read(__dirname+'/data/water.csv', function(err, rows){
    rows.splice(0, 1);
    rows.forEach(add);
  });
};

function add(row) {
  var data = {
    name : 'Water',
    authority : 'AHB',
    type : 'simple',
    description : 'water cost from SWAP',
    price : parseFloat(row[2].replace('$','')),
    units : 'us$',
    locality : [row[1].toLowerCase()]
  };

  //console.log(data);
  update(data);
}
