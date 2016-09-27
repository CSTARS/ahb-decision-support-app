var model = require('../models/parcelCache')();


module.exports = function(router) {
  router.get('/get', function(req, res){
    var lat = req.query.lat;
    var lng = req.query.lng;
    var radius = req.query.radius;

    model.get(lat, lng, radius, res);
  });
};
