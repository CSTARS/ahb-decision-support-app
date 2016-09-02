var AdmZip = require('adm-zip');

module.exports = function(router) {

  router.post('/toJson', function(req, res){
    // var json = JSON.parse(req.body.data);
    var parts = req.body.data.split('\n');

    // creating archives 
    var zip = new AdmZip();
    
    // add file directly 
    zip.addFile("parcels.json", new Buffer(parts[0]));
    zip.addFile("growthProfiles.json", new Buffer(parts[1]));

    // get everything as a buffer 
    var zipData = zip.toBuffer();

    res.set('Content-Disposition', 'attachment; filename="export.zip";');
    res.set('Content-Type', 'application/zip');
    res.send(zipData);
  });
};
