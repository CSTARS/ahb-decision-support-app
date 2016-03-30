var model = require('../models/crops')();


module.exports = function(router) {
  router.post('/get', function(req, res){
    var geometryCollection = req.body.geometries;

    model.getCrops(geometryCollection, function(err, result){
      if( err ){
        return res.send({error: true, message: err});
      }

      res.send(result);
    });
  });
};
