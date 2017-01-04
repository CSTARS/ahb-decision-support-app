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

        this.setPage();
    },

    setPage : function() {
        var location = window.location.hash.replace(/#/,'').split('/');
        if( location.length === 0 ) location = ['map'];
        this.selectedPage = location[0];
    }
});
