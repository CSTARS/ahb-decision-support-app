var app = require('../app');
var sdk = require('../sdk');

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
          <div>Capital Cost: $${r.capitalCost}</div>
          <div>Operating Cost: ${r.operatingCost.value} (${r.operatingCost.units})</div>
          <div>${r.product.name} Yield: ${r.yield.value} (${r.yield.units})</div>
          <div>Feedstock Capacity: ${r.feedstockCapacity.value} (${r.feedstockCapacity.units})</div>
        `;
        
      },

      run : function() {
        this.$.startBtn.style.display = 'none';
        document.querySelector('results-panel').breakdownRendered = false;
        
        var options = {
            lat : this.lat,
            lng : this.lng,
            radius : parseInt(this.$.radiusInput.value)*1000,
            refinery : this.$.refinerySelector.value
        };

        app.run(options, function(){
          this.$.startBtn.style.display = 'block';
          this.$.go.innerHTML = '<i class="fa fa-undo"></i> Rerun <span class="hidden-xs">Model</span>';
          $('#results-header').show().trigger('click');
          $('#map-header').html('<h4><i class="fa fa-map-marker"></i> Parcel Map</h4>');
        }.bind(this));
      }
    });