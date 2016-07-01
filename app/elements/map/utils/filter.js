var sdk = require('../../sdk');
var localdb = sdk.localdb;
var async = require('async');

var FilterBehavior = {
    filter : function() {
        // remove all transportation polyline's, they will be added 
        // back in once filtering is complete.
        for( var i = this.canvasLayer.features.length-1; i >= 0; i-- ) {
          var type = this.canvasLayer.features[i].type;
          if( type === 'LineString' ) {
            this.canvasLayer.features.splice(i, 1);
          }
        }

        this.currentNetwork = {};

        this.hasFilters = this.filters.length > 0 ? true : false;
        this.filterHash = {};
        for( var i = 0; i < this.filters.length; i++ ) {
            this.filtersHash[this.filters[i]] = 1;
        }

        async.eachLimit(
            sdk.collections.parcels.validIds, 
            50,
            (id, next) => {
                localdb.get('parcels', id, (parcel) => {
                    this._filterParcel(parcel, next);
                });
            },
            this._onFilteringComplete.bind(this)
        );

        /*localdb.forEach(
            'parcels',
            this._filterParcel.bind(this),
            this._onFilteringComplete.bind(this)
        );*/
    },

    _onFilteringComplete : function() {
        for( var id in this.currentNetwork ) {
            var feature = sdk.collections.transportation.network[id];
            if( feature.properties.error ) {
                continue;
            }
            
            this.canvasLayer.addCanvasFeature(new L.CanvasFeature(feature));
        }

        this.menu.updateSelected();
        this.canvasLayer.render();
    },

    _filterParcel : function(parcel, next) {
        var clFeature = this.canvasLayer.getCanvasFeatureById(parcel.properties.id);

        var props = parcel.properties.ucd;

        if( ( props.selected || this.showAllParcels) && filteredParcel(parcel, this.filters, this) ) {
            clFeature.visible = true;
            clFeature.render.filtered = true;
        } else {
            clFeature.render.filtered = false;
            clFeature.visible = false;
            return next();
        }

        clFeature.render.adoptionPricePercentile = props.adoptionPricePercentile;

        /**
         * Now let's handle the transportation polyline
         */
        if( props.transportation.error ) {
            return;
        }

        // set the current network
        var path = props.transportation.path;
        if( !path ) {
            return next();
        }
        
        var id, i;
        for( var i = 0; i < path.length; i++ ) {
            id = path[i];
            if( this.currentNetwork[id] === undefined ) {
                this.currentNetwork[id] = 1;
            } else {
                this.currentNetwork[id]++;
            }
        }

        // render a line for shortest path vertex to feature centroid
        var f = sdk.collections.transportation.network[path[0]];
        var feature = {
            type : 'Feature',
            geometry : {
                type : 'LineString',
                coordinates : [
                f.geometry.coordinates[0],
                parcel.properties.ucd.center
                ]
            },
            properties : {
                type : 'start'
            }
        };

        if( feature.geometry.coordinates[0] === undefined || feature.geometry.coordinates[1] === undefined ) {
            return next();
        }

        var clFeature = new L.CanvasFeature(feature);
        clFeature.lineType = 'start';
        this.canvasLayer.addCanvasFeature(clFeature);

        next();
    }
}

function filteredParcel(parcel, filters, $this) {
    if( !parcel.properties.ucd.cropInfo ) {
        return false;
    }

    if( !$this.hasFilters ) {
        return true;
    }

    for( var i = 0; i < parcel.properties.ucd.cropInfo.swap.length; i++ ) {
        if( this.filtersHash[parcel.properties.ucd.cropInfo.swap[i]] ) {
            return true;
        }
    }

    return false;
}


module.exports = FilterBehavior;