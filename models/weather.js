var async = require('async');
var pg = require('../lib/pg');


module.exports = function() {
  return {
    getWeather : getWeather
  };
};

function getWeather(arr, callback) {
  var result = [];

  async.eachSeries(
    arr,
    function(lnglat, next) {
      pg.client().query('select * from public_view.pointtoweather('+lnglat+',8192)', function(err, resp){
        if( err ) {
          result.push([]);
        } else {
          result.push(resp.rows);
        }

        next();
      });
    },
    function() {
      callback(null, result);
    }
  );
}
