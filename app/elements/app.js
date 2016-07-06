window.require = require;

var sdk = require('./sdk');
var events = require('events').EventEmitter;


function App() { 

    var listeners = [];
    var grown = false;
    var runConsole;
    var ee = new events();
    
    sdk.init(function(){
        console.log('budget loaded');
    });
    
    this.on = function(e, fn) { 
        ee.on(e, fn);
    }
    
    this.setOnCompleteListener = function(fn) {
        listeners.push(fn);
    };
    
    this.getOnCompleteListeners = function() {
        return listeners;
    };
    
    this.registerRunConsole = function(rc) {
        runConsole = rc;
    }

    this.run = function(options, callback) {
        runConsole.onStart(options);

        sdk.controllers.refinery.model(options, () => {
            this.getOnCompleteListeners().forEach(function(fn){
                fn();
            });

            if( callback ) callback();
        });
    }
    
    this.setPoplarPrice = function(price) {
        alert('TODO');
        /*datastore.poplarPrice = price;
        
        var options = {
            minPrice : price-2,
            maxPrice : price+2,
            step : 0.05,
            setPoplarPrice : false
        };
        
        sdk.adoption.breakdown(options, (resp) => {
            this.breakdown = resp.results;
            sdk.adoption.selectParcels();
            datastore.setTotals(() => {
                ee.emit('poplar-price-update', price);
            });
        });*/
    };
    
    this.getPoplarPrice = function() {
        return this.price || 24;
    };
}

module.exports = new App();