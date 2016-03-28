var read = require('./read');
var update = require('./updateFB');

module.exports = function() {
  read(__dirname+'/data/wages.csv', function(err, rows){
    rows.splice(0, 1);
    rows.forEach(add);
  });
};

function add(row) {
  var data = {
    name : 'Labor',
    authority : 'AHB',
    type : 'simple',
    description : 'Non-machine labor from SWAP',
    price : parseFloat(row[2]),
    units : 'us$/h',
    locality : [row[1].toLowerCase()]
  };

  var data2 = {
    name : 'Machine Labor',
    authority : 'AHB',
    type : 'simple',
    description : 'Machine labor from SWAP',
    price : parseFloat(row[3]),
    units : 'us$/h',
    locality : [row[1].toLowerCase()]
  };

  update(data);
  update(data2);
}
