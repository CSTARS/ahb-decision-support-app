var read = require('./read');
var update = require('./updateFB');
var fips = require('./fips');

module.exports = function() {
  read(__dirname+'/data/land.csv', function(err, rows){
    rows.splice(0, 1);
    rows.forEach(add);
  });
};

function add(row) {
  if( row[3] !== 'f' || row[4] !== 'f' || row[5] !== 'f'  ) {
    return;
  }

  var state = fips(row[1]);
  if( !state ) {
    return;
  }

  var data = {
    name : 'Land Rent',
    authority : 'AHB',
    type : 'simple',
    description : 'land rent from SWAP\n'+row[7],
    price : parseFloat(row[6]),
    units : 'us$',
    locality : [fips(row[1])]
  };

  update(data);
}
