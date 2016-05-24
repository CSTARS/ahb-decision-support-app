var app = require('../app');
var sdk = require('../sdk');
var utils = require('../utils');


    Polymer({
      is: 'refinery-select-popup',
      ready : function() {
        this.popup = $(this.$.popup).remove();
        $('body').append(this.popup);
        this.popup.modal({
          show: false,
          backdrop : 'static'
        });
        this.active = false;
      },

      show : function(lat, lng) {
        this.popup.modal('show');
        this.lat = lat;
        this.lng = lng;
        this.$.ll.innerHTML = lat.toFixed(4)+', '+lng.toFixed(4);
        this.$.go.innerHTML = '<i class="fa fa-industry"></i> Model <span class="hidden-xs">Refinery</span>';
        
        if( !this.refineryOptions ) {
            sdk.datastore.getAllRefineries((refineries) => {
               this.refineryOptions = refineries;
               this.renderRefinerySelector();
            });
        }
      },

      hide : function() {
        this.popup.modal('hide');
      },
      
      setValues : function(values) {
        this.$.radiusInput.value = values.radius / 1000;
        this.$.refinerySelector.value = values.refinery;
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
        
        
        this.$.refineryInfo.innerHTML = `
          <table class="table">
            <tr><td><b>Capital Cost:</b></td><td>$${utils.formatAmount(r.capitalCost)}</td></tr>
            <tr><td><b>Operating Cost:</b></td><td>${utils.formatAmount(r.operatingCost.value)} (${r.operatingCost.units})</td></tr>
            <tr><td><b>${r.product.name} Yield:</b></td><td>${r.yield.value} (${r.yield.units})</td></tr>
            <tr><td><b>Feedstock Capacity:</b></td><td>${utils.formatAmount(r.feedstockCapacity.value)} (${r.feedstockCapacity.units})</td></tr>
          </table>
        `;
        
      },

      run : function() {
        this.$.startBtn.style.display = 'none';
        document.querySelector('results-panel').breakdownRendered = false;
        
        var options = {
            lat : this.lat,
            lng : this.lng,
            radius : parseInt(this.$.radiusInput.value)*1000,
            refinery : this.$.refinerySelector.value,
            routeGeometry : this.$.routeInput.checked ? true : false
        };

        app.run(options, function(){
          this.$.startBtn.style.display = 'block';
          this.$.go.innerHTML = '<i class="fa fa-undo"></i> Rerun <span class="hidden-xs">Model</span>';
          $('#results-header').show().trigger('click');
          $('#map-header').html('<h4><i class="fa fa-map-marker"></i> Parcel Map</h4>');
        }.bind(this));
      }
    });