var model = require('../models/soil')();

module.exports = function(router) {
  router.post('/get', function(req, res){
    var latlngs = req.body.coordinates;

    model.getSoil(latlngs, function(err, result){
      if( err ){
        return res.send({error: true, message: err});
      }

      res.send({coordinates: result});
    });
  });
};
