
module.exports = function(router) {
  router.get('/world', function(req, res){
    res.send('Hello World');
  });
};
