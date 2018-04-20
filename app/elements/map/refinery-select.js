var app = require('../app');
var utils = require('../utils');


    Polymer({
      is: 'refinery-select',

      properties : {
        active : {
          type : Boolean,
          observer : 'onShow'
        }
      },

      behaviors : [EventBusBehavior],

      ebBind : {
        'simulation-start' : 'onSimulationStart',
        'refinery-model-run-complete' : 'onSimulationComplete'
      },

      ready : function() {
        this.active = false;
        
        this.getTreeType((trees) => {
          var html = '';
          for( var type in trees ) {
            html += `<option value="${type}">${type}</option>`;
          }
          this.$.treeInput.innerHTML = html;
        });
      },

      getTreeType : function(callback) {
        this.getEventBus().emit('get-tree-types', {handler: callback});
      },
      
      back : function() {
        window.location.hash = '#map';
      },

      onSimulationComplete : function() {
        this.$.startBtn.style.display = 'block';
      },

      onSimulationStart : function() {
        this.$.startBtn.style.display = 'none';
      },

      onShow : function() {
        if( !this.active ) return;
        if( this.lat === undefined || this.lng === undefined ) {
          return window.location.hash = '#map';
        }
      },

      show : function(lat, lng) {
        this.lat = lat;
        this.lng = lng;
        this.$.ll.innerHTML = lat.toFixed(4)+', '+lng.toFixed(4);
        
        this.getRefineryData((refineries, selected) => {
          if( !this.refineryOptions ) {
              this.refineryOptions = refineries;
              this.renderRefinerySelector();
          }

          var ror = 0.10;
          if( selected ) {
            ror = selected.ROR;
          }
          this.$.ror.value = ror * 100;

          var maxPastureLand = 0.25;
          if( selected ) {
            maxPastureLand = selected.maxPastureLandAdoption;
          }
          this.$.maxPastureLand.value = maxPastureLand * 100;
        });
      },

      getRefineryData : function(callback) {
        this.ebChain(
          [
            'get-all-refineries',
            'get-selected-refinery'
          ],
          (results) => {
            callback.apply(this, results);
          }
        )
      },
      
      setValues : function(values) {
        this.$.radiusInput.value = values.radius / 1000;
        this.$.refinerySelector.value = values.refinery;
        this.$.treeInput.value = values.tree || 'Generic';
      },
      
      renderRefinerySelector : function() {
         var html = '';
         this.refineryOptions.forEach((r) => {
             html += `<option value="${r.name}">${r.name}</option>`;
         });
         this.$.refinerySelector.innerHTML = html;
         this.$.refinerySelector.removeAttribute('disabled');
         this.renderRefineryInfo();
      },
      
      renderRefineryInfo : function(e) {
        var r;
        for( var i = 0; i < this.refineryOptions.length; i++ ) {
          if( this.refineryOptions[i].name === this.$.refinerySelector.value ) {
            r = this.refineryOptions[i];
            break;
          }
        }
        
        this.$.capitalCost.innerHTML = utils.formatAmount(r.capitalCost);
        this.$.operatingCost.innerHTML = utils.formatAmount(r.operatingCost.value);
        this.$.operatingCostUnits.innerHTML = r.operatingCost.units;
        this.$.productName.innerHTML = r.product.name;
        this.$.productYield.innerHTML = r.yield.value;
        this.$.productUnits.innerHTML = r.yield.units;
        this.$.feedstockCapacity.innerHTML = utils.formatAmount(r.feedstockCapacity.value);
        this.$.feedstockCapacityUnits.innerHTML = r.feedstockCapacity.units;
      },

      run : function() {
        window.location.hash = '#console';

        this.getEventBus().emit('set-selected-tree', this.$.treeInput.value);

        var options = {
            lat : this.lat,
            lng : this.lng,
            radius : parseInt(this.$.radiusInput.value)*1000,
            refinery : this.$.refinerySelector.value,
            routeGeometry : this.$.routeInput.checked ? true : false,
            ROR : parseFloat((parseFloat(this.$.ror.value) / 100).toFixed(2)),
            maxPastureLand : parseFloat((parseFloat(this.$.maxPastureLand.value) / 100).toFixed(2))
        };

        app.run(options);
      }
    });