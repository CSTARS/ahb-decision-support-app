var sdk = require('../sdk');

Polymer({
    is: 'app-layout',

    properties : {
        selectedPage : {
            type : String,
            value : 'map'
        }
    },

    ready : function() {
        window.addEventListener('hashchange', this.setPage.bind(this));
    },

    attached : function() {
        // HACK for paper-drawer closing too easily....
        // https://github.com/PolymerElements/paper-drawer-panel/issues/140
       this.$.drawerPanel._trackEnd = function(event) {
          if (this.dragging) {
            var xDirection = event.detail.dx > -100;
            this._setDragging(false);
            this._transition = true;
            this._moveDrawer(null);
            if (this.rightDrawer) {
              this[xDirection ? 'closeDrawer' : 'openDrawer']();
            } else {
              this[xDirection ? 'openDrawer' : 'closeDrawer']();
            }
          }
        }.bind(this.$.drawerPanel);


        this.$.map.selectPanel = this.$.select;

        var hash = window.location.hash.replace('#', '').split('/');
        if( hash[0] === 'l' ) {
            var latlng = L.latLng(parseFloat(hash[1]), parseFloat(hash[2]));
            this.$.map.setLatLng(latlng);
            setTimeout(() => {
                this.$.select.setValues({
                    radius : parseFloat(hash[3]),
                    refinery : decodeURIComponent(hash[4]),
                    tree: hash.length > 4 ? decodeURIComponent(hash[5]) : 'Generic'
                });
            }, 100);
        }

        window.location.hash = '#map';

        this.$.map.setMenu(this.$.menu);
    },

    setPage : function() {
        var location = window.location.hash.replace(/#/,'').split('/');
        if( location.length === 0 ) location = ['map'];
        this.selectedPage = location[0];
    }
});
