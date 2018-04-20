var utils = require('../utils');

Polymer({
    is: 'model-run-console',

    properties : {
        lines : {
            type : Array,
            value : function() {
                return [];
            }
        }
    },

    behaviors : [EventBusBehavior],

    ebBind : {
        // kickoff event
        'simulation-start': 'onStart',
        'refinery-model-run-complete': 'onEnd',
        // transportation events
        'transportation-update-start': 'onTransportationStart',
        'transportation-update-end': 'onTransportationEnd',
        'transportation-update' : 'onTransportationUpdate',
        // weather events
        'weather-update-start': 'onWeatherStart',
        'weather-update-end': 'onWeatherEnd',
        // soil events
        'soil-update-start': 'onSoilStart',
        'soil-update-end': 'onSoilEnd',
        // parcel events
        'parcels-update-start': 'onParcelStart',
        'parcels-update-updated': 'onParcelUpdated',
        'parcels-update-end': 'onParcelEnd',
        // crop events
        'crops-update-start': 'onCropsStart',
        'crops-update-updated': 'onCropsUpdated',
        'crops-update-end': 'onCropsEnd',
        'crop-priceyield-update-start': 'onCropPriceYieldStart',
        'crop-priceyield-update-end': 'onCropPriceYieldEnd',
        // budget events
        'budgets-update-start': 'onBudgetsStart',
        'budgets-update-end': 'onBudgetsEnd',
        // summary events
        'results-summary-start': 'onSummaryStart',
        'results-summary-end': 'onSummaryEnd',
        // optimize events
        'optimize-start': 'onOptimizeStart',
        'optimize-update': 'onOptimizeUpdate',
        'optimize-end': 'onOptimizeEnd',
        // harvest events
        'harvests-start': 'onHarvestsStart',
        'harvests-updated': 'onHarvestsUpdated',
        'harvests-end': 'onHarvestsEnd',
    },

    onStart : function(options) {
        this.startTime = new Date().getTime();
        this.$.console.innerHTML = '';
        this.style.display = 'block';
        this.$.resultsBtn.style.display = 'none';

        var lat = options.lat.toFixed(4);
        var lng = options.lng.toFixed(4);
        var r = options.radius / 1000;
        
        this.createLine('start', `Starting run for ${options.refinery} refinery @ ${lat}, ${lng} Radius: ${r}km`);
    },

    onEnd : function() {
        this.createLine('end', 'Finished. Execution Time: '+((new Date().getTime() - this.startTime) / 1000).toFixed(2)+'s');

        this.getSimulationData((selectedRefinery, summary) => {
            var yieldRequired = selectedRefinery.feedstockCapacity.value;
            var ayield = summary.avgYearHarvest;
    
            if( ayield < yieldRequired ) {
                this.createLine('warning', 
                    `The current simulation only produced ${utils.formatAmount(ayield)} Mg/Year of Poplar with a radius of ${selectedRefinery.radius/1000}km.  ${utils.formatAmount(yieldRequired)} Mg/Year is required for the selected refinery.  You may try expanding the simulation radius.`,
                    'text text-danger','<iron-icon icon="report-problem"></iron-icon>');
            }

            this.$.resultsBtn.style.display = 'inline-block';
        });
    },

    getSimulationData : function(callback) {
        // Would be nice to do something like...
        // this.ebChain([
        //         {method: 'get-selected-refinery'},
        //         {method: 'get-parcels-summary'}
        //     ],
        //     callback
        // );

        this.getSelectedRefinery((selectedRefinery) => {
            this.getParcelSummary((summary) => {
                callback(selectedRefinery, summary);
            });
        });
    },

    getSelectedRefinery : function(callback) {
        this.getEventBus().emit('get-selected-refinery', {handler: callback});
    },

    getParcelSummary : function(callback) {
        this.getEventBus().emit('get-parcels-summary', {handler: callback});
    },

    goToResults : function() {
        window.location.hash = '#results';
    },

    onHarvestsStart : function() {
        this.createLine('harvest', 'Growing Poplar %0','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onHarvestsUpdated : function(e) {
        this.updateLine('harvest', 'Growing Poplar %'+e.percent);
    },

    onHarvestsEnd : function() {
        this.updateLine('harvest', 'Poplar grown.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onParcelStart : function() {
        this.createLine('parcel', 'Finding available parcels','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onParcelUpdated : function(e) {
        this.updateLine('parcel', 'Finding available parcels %'+e.percent);
    },

    onParcelEnd : function(e) {
    // currently parcel count is not available at this point.  TODO: fix this
        this.updateLine('parcel', 'Parcels loaded. ','highlight','<iron-icon icon="check"></iron-icon>');
    //    this.updateLine('parcel', 'Parcels loaded. '+e.length,'highlight','<iron-icon icon="check"></iron-icon>');
    },

    onTransportationStart : function() {
        this.createLine('transportation', 'Looking up transportation routes %0','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onTransportationUpdate : function(e) {
        this.updateLine('transportation', 'Looking up transportation routes %' +
        e.percent+' (~'+(e.timeRemaining/1000).toFixed(2)+'s @ '+e.averageTime.toFixed(2)+'ms/route)');
    },

    onTransportationEnd : function() {
        this.updateLine('transportation', 'Transportation routes loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onCropsStart : function() {
        this.createLine('crops', 'Looking up crop type for parcels.','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onCropsUpdated : function(e) {
        this.updateLine('crops', 'Looking up crop type for parcels %'+e.percent);
    },

    onCropsEnd : function() {
        this.updateLine('crops', 'Crop type loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onCropPriceYieldStart : function() {
        this.createLine('cropPriceYield', 'Looking up crop price and yield','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onCropPriceYieldEnd : function() {
        this.updateLine('cropPriceYield', 'Crop price and yield loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },
    
    onBudgetsStart : function() {
        this.createLine('budget', 'Looking up farm budgets from farmbudgets.org','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onBudgetsEnd : function() {
        this.updateLine('budget', 'Farm budgets loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onSummaryStart : function() {
        this.createLine('summary', 'Summarizing results','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onSummaryEnd : function() {
        this.updateLine('summary', 'Results summarized.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onOptimizeStart : function() {
        this.createLine('optimize', 'Calulating price','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onOptimizeUpdate : function(e) {
        this.updateLine('optimize', 'Calulating price %'+ (e*100).toFixed(0));
    },

    onOptimizeEnd : function() {
        this.updateLine('optimize', 'Optimal price calculated.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onWeatherStart : function() {
        this.createLine('weather', 'Loading weather data','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" style="width:24px;height:24px" active></paper-spinner-lite>');
    },

    onWeatherEnd : function() {
        this.updateLine('weather', 'Weather loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onSoilStart : function() {
        this.createLine('soil', 'Loading soil data','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onSoilEnd : function() {
        this.updateLine('soil', 'Soil loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    createLine : function(id, msg, className, icon) {
        var line = document.createElement('module-run-console-line');
        line.setText(msg);
        line.setIcon(icon);
        if( className !== undefined ) {
            line.setClassName(className);
        }

        this.lines[id] = line;
        Polymer.dom(this.$.console).appendChild(line);

        this.fire('line-added');
    },

    updateLine : function(id, msg, className, icon) {
        if( !this.lines[id] ) {
            return;
        }

        var line = this.lines[id];

        line.setText(msg);
        line.setIcon(icon);
        if( className !== undefined ) {
            line.setClassName(className);
        }
    }
});
