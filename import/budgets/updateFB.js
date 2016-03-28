var sdk = require('./sdk')();
var TOKEN = '# Crop Demo From SWAP';

function updateMaterial(data, callback){
  var q = {
    query : {
      authority : "AHB",
      name : data.name,
      locality : data.locality
    }, // mongodb query
    start : 0, // start index
    stop : 10, // stop index
  };
  var re = new RegExp(TOKEN+'$');

  sdk.materials.search(q, function(resp){

    var id = '';
    for( var i = 0; i < resp.results.length; i++ ) {
      if( resp.results[i].source && resp.results[i].source.match(re) ) {
        id = resp.results[i].id;
        break;
      }
    }

    if( id ) console.log('UPDATE MATERIAL');
    else console.log('INSERT MATERIAL');

    data.id = id;
    data.source = (data.source || '')+'\n'+TOKEN;

    var material = sdk.createMaterial(data);
    material.save(function(){

    });
  });
}

module.exports = updateMaterial;
