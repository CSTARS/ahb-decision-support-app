var async = require('async');

var read = require('./read');
var update = require('./updateFB');
var fips = require('./fips');
var sdk = require('./sdk')();

var TOKEN = '# Crop Demo From SWAP';
var materialCache = {};
var laborAmount = {};

module.exports = function() {
  read(__dirname+'/data/labor.csv', function(err, rows){
    rows.forEach(function(row){
      laborAmount[row[1]+row[2]] = {
        machine : val(row[3]),
        labor : val(row[4])
      };
    });

    read(__dirname+'/data/all.csv', function(err, rows){
      rows.splice(0, 1);

      async.eachSeries(rows,
        function(data, next){
          add(data, next);
        },
        function(err) {
          console.log('done.');
        }
      );
    });
  });
};

function add(data, next) {
  if( data[3] === '' ) {
    return next();
  }

  find('Labor', data[0].toLowerCase(), function(labor){
    find('Machine Labor', data[0].toLowerCase(), function(machineLabor){
      getBudget(data, function(budget){
        createBudget(budget, data, labor, machineLabor, laborAmount[data[1]+data[2]], next);
      });


    });
  });
}

function getBudget(data, callback) {
  findBudget(data[2], data[0], function(budget){
    if( !budget ) {
      console.log('NEW');
      callback(sdk.newBudget());
    } else {
      console.log('UPDATE');
      sdk.loadBudget(budget.id, callback);
    }
  });
}

function createBudget(budget, data, labor, machineLabor, laborAmount, next) {
    budget.setFarm('Generic farm for SWAP', 1, '[acr_us]');
    budget.setAuthority('AHB');
    budget.setLocality(data[0]);
    budget.setName('SWAP - '+data[0]+', '+data[2]);
    budget.setCommodity(data[2]);
    budget.setDescription(TOKEN);

    budget.addMaterial(sdk.createMaterial(labor));
    budget.addMaterial(sdk.createMaterial(machineLabor));


    var operation;

    try {
      operation = budget.getOperation('Farming');
      budget.removeOperation('Farming');
    } catch(e) {}

    operation = budget.addOperation('Farming');
    operation.schedule({date: new Date(), length: 1, units: 'year'});


    operation.addRequiredMaterial({name: labor.name, amount: laborAmount.labor, units: 'h'});
    operation.addRequiredMaterial({name: machineLabor.name, amount: laborAmount.machine, units: 'h'});
    operation.addRequiredMaterial({name: 'Estimate', amount: val(data[5]), units: 'us$', note: 'Water'});
    operation.addRequiredMaterial({name: 'Estimate', amount: val(data[6]), units: 'us$', note: 'Land'});
    operation.addRequiredMaterial({name: 'Estimate', amount: val(data[3]), units: 'us$', note: 'Other Variable Cost'});

    // console.log('---------');
    // console.log(budget.getData());

    budget.save(function(resp){
      next();
    });

}

function val(txt) {
  return parseFloat(txt.replace('$', ''));
}

function findBudget(crop, locality, callback) {
  var q = {
    query : {
      authority : 'AHB',
      commodity : crop.toLowerCase(),
      locality : locality.toLowerCase()
    }, // mongodb query
    start : 0, // start index
    stop : 10, // stop index
  };
  var re = new RegExp(TOKEN+'$');

  sdk.budgets.search(q, function(resp){
    var id = '';
    for( var i = 0; i < resp.results.length; i++ ) {
      if( resp.results[i].description && resp.results[i].description.match(re) ) {
        return callback(resp.results[i]);
      }
    }

    callback(null);
  });
}

function find(name, locality, callback) {
  if( materialCache[name+locality] ) {
    return callback(materialCache[name+locality]);
  }

  var q = {
    query : {
      authority : 'AHB',
      name : name,
      locality : locality
    }, // mongodb query
    start : 0, // start index
    stop : 10, // stop index
  };
  var re = new RegExp(TOKEN+'$');

  sdk.materials.search(q, function(resp){

    var id = '';
    for( var i = 0; i < resp.results.length; i++ ) {
      if( resp.results[i].source && resp.results[i].source.match(re) ) {
        materialCache[name+locality] = resp.results[i];
        return callback(resp.results[i]);
      }
    }

    callback(null);
  });
}
