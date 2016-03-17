var async = require('async');
var pg = require('../lib/pg');

module.exports = function() {
  return {
    getSoil : getSoil
  };
};

function getSoil(arr, callback) {
  var result = [];

  async.eachSeries(
    arr,
    function(lnglat, next) {
      pg.client().query('select * from public_view.pointtosoil('+lnglat+',8192)', function(err, resp){
        if( err ) {
          result.push([]);
        } else {

          resp.rows.forEach(function(item){
            for( var key in item ) {
              item = parseFloat(item[key]);
            }
          });

          result.push(resp.rows[0]);
        }

        next();
      });
    },
    function() {
      callback(null, result);
    }
  );
}
