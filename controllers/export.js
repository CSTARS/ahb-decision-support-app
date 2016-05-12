module.exports = function(router) {

  router.post('/toJson', function(req, res){
    var json = JSON.parse(req.body.data);

    res.set('Content-Disposition', 'attachment; filename="export.json";');
    res.set('Content-Type', 'application/download');
    res.send(JSON.stringify(json, '  ', '  '));
  });
};
