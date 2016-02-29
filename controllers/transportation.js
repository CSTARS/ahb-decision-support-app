var model = require('../models/transportation');


module.exports = function(router) {
  router.post('/getRoutes', function(req, res){
    var sources = req.body.sources;
    var destination = req.body.destination;

    model.getRoutes(sources, destination, function(err, result){
      if( err ){
        return res.send({error: true, message: err});
      }

      res.send(result);
    });
  });
};
