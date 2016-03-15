var model = require('../models/transportation')();


module.exports = function(router) {
  router.post('/getRoutes', function(req, res){
    var sources = req.body.sources;
    var destination = req.body.destination;
    var options = req.body.options || {};

    model.getRoutes(sources, destination, options, function(err, result){
      if( err ){
        return res.send({error: true, message: err});
      }

      res.send(result);
    });
  });
};
