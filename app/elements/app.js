window.require = require;

var sdk = require('./sdk');
var events = require('events').EventEmitter;
window.sdk = sdk;

// set global variable for Polymer EventBusBehavior
window.EventBus = sdk.eventBus;

function App() { 

    var listeners = [];
    var grown = false;
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

    this.run = function(options, callback) {
        //options.setPoplarPrice = 94;

        sdk.eventBus.emit('simulation-start', options);

        sdk.controllers.refinery.model(options, () => {
            this.getOnCompleteListeners().forEach(function(fn){
                fn();
            });

            if( callback ) callback();
        });
    }
    
    this.setPoplarPrice = function(price) {
        var options = {
            setPoplarPrice : price
        }

        sdk.controllers.refinery.optimize(options);
    };

    this.setRor = function(ror) {
        sdk.collections.refineries.selected.setRor(ror);
        sdk.controllers.refinery.optimize({});
    };

    this.setMaxPastureLand = function(maxPastureLand) {
        sdk.collections.refineries.selected.setMaxPastureLand(maxPastureLand);
        sdk.controllers.refinery.optimize({});
    };
    
    this.getPoplarPrice = function() {
        return this.price || 24;
    };
}

module.exports = new App();