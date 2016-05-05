var sdk = require('../sdk');

    Polymer({
      is: 'menu-map-options',

      attached : function() {
        this.mapElement = document.querySelector('parcel-map');
        this.mapElement.setMenu(this);
      },

      setMode : function(mode) {
        this.mode = mode;
        if( this.mode === 'set' ) {
          this.$.mode.checked = true;
        } else {
          this.$.mode.checked = false;
        }
      },

      updateMode : function() {
        this.mode = this.$.mode.checked ? 'set' : 'select';
        this.mapElement.setMode(this.mode);
      },

      setInfo : function(lat, lng, radius) {
        this.$.info.style.display = 'block';
        this.$.ll.innerHTML = lat.toFixed(4)+', '+lng.toFixed(4);
        this.$.radius.innerHTML = radius/1000+'km';
      },

      updateSelected : function() {
        this.$.parcels.innerHTML = sdk.datastore.selectedParcels.length + ' of ' +
                          sdk.datastore.allParcels.length;
      }
    });