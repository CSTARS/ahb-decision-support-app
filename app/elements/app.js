// bug where chrome lets this disappear sometimes...
window.require = require;

var sdk = require('./sdk');
// for command line debugging
window.sdk = sdk;

// set global variable for Polymer EventBusBehavior
window.EventBus = sdk.eventBus;

function App() { 
    sdk.init(function(){
        console.log('budget loaded');
    });

    this.run = function(options, callback) {
        sdk.eventBus.emit('simulation-start', options);
        sdk.controllers.refinery.model(options);
    }
    
    // this.getPoplarPrice = function() {
    //     return this.price || 24;
    // };
}

module.exports = new App();