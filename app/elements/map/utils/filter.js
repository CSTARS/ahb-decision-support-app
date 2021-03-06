var FilterBehavior = {
    filter : function(filters) {
        if( filters ) this.filters = filters;
        if( !this.filters ) this.filters = [];

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
        this.filtersHash = {};
        for( var i = 0; i < this.filters.length; i++ ) {
            this.filtersHash[this.filters[i]] = 1;
        }

        this._getFilterData((parcels, routes, paths) => {
            var transportation = {routes, paths};

            for( var key in parcels ) {
                this._filterParcel(parcels[key], transportation);
            }

            this._onFilteringComplete(transportation);
        });
    },

    _getFilterData : function(callback) {
        this.ebChain(
            [
                {event: 'get-parcels'},
                {event: 'get-transportation-routes'},
                {event: 'get-transportation-paths'}
            ],
            (results) => {
                callback.apply(this, results);
            }
        )
    },


    _onFilteringComplete : function(transportationData) {
        for( var id in this.currentNetwork ) {
            var feature = transportationData.paths[id];
            if( feature.properties.error ) {
                continue;
            }
            
            this.canvasLayer.addCanvasFeature(new L.CanvasFeature(feature));
        }

        this.canvasLayer.render();
    },

    _filterParcel : function(parcel, transportationData) {
        var clFeature = this.canvasLayer.getCanvasFeatureById(parcel.properties.id);

        var props = parcel.properties.ucd;

        if( ( props.selected || this.showAllParcels) && filteredParcel(parcel, this.filters, this) ) {
            clFeature.visible = true;
            clFeature.render.filtered = true;
        } else {
            clFeature.render.filtered = false;
            clFeature.visible = false;
            return;
        }

        clFeature.render.isParcel = true;
        clFeature.render.adoptionPricePercentile = props.adoptionPricePercentile;
        clFeature.render.aboveRefineryWillingToPay = props.aboveRefineryWillingToPay ? true : false;
        clFeature.render.pastureIgnored = props.pastureIgnored;

        /**
         * Now let's handle the transportation polyline
         */
        // only render selected parcel polylines
        if( !props.selected ) {
            return;
        }

        var transportation = transportationData.routes[parcel.properties.id];
        if( transportation.error ) {
            return;
        }

        // set the current network
        var path = transportation.path;
        if( !path ) {
            return;
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
        var f = transportationData.paths[path[0]];
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
                type : 'start',
                id : 'start-'+path[0]
            }
        };

        if( feature.geometry.coordinates[0] === undefined || feature.geometry.coordinates[1] === undefined ) {
            return;
        }

        var clFeature = new L.CanvasFeature(feature);
        clFeature.lineType = 'start';
        this.canvasLayer.addCanvasFeature(clFeature);
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
        if( $this.filtersHash[parcel.properties.ucd.cropInfo.swap[i]] ) {
            return true;
        }
    }

    return false;
}


module.exports = FilterBehavior;