var pg = require('../../lib/pg');
var fs = require('fs');
var async = require('async');

var confit = require('confit');
confit('../../config').create(function(err, config) {
  if( fs.existsSync('/etc/ahb-decision-support-app/config.json') ) {
    config.use(require('/etc/ahb-decision-support-app/config.json'));
  }
  require('../../lib/config').set(config);

  var data = require('../../tmp');

  pg.connect(function() {

    setTimeout(function(){
      async.eachSeries(
        data.geometries,
        function(geo, next) {
          var coll = {
            type : 'GeometryCollection',
            geometries : [geo]
          };

          pg.willowClient().query('select cdl.land_cover_yield($1)', [JSON.stringify(coll)], function(err, resp){
            if( err ) {
              console.log(err);
              console.log(JSON.stringify(geo));
            } else {
              console.log('ok');
            }


            next();
          });
        },
        function(err) {
          console.log('done');
        }
      );
    }, 200);



  });
});
