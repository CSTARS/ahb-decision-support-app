var model = require('../models/weather')();

module.exports = function(router) {
  router.post('/get', function(req, res){
    var latlngs = req.body.coordinates;

    model.getWeather(latlngs, function(err, result){
      if( err ){
        return res.send({error: true, message: err});
      }

      res.send({coordinates: result});
    });
  });
};
