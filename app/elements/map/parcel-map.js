var app = require('../app');
var sdk = require('../sdk');
var renderer = require('./renderer');


    Polymer({
      is: 'parcel-map',

      ready : function() {
        // map render/filter stuff
        this.filters = [];
        this.showAllParcels = false;
        this.cropTypes = [];

        // current modes are 'set' (set refinery location) or 'select' which is select parcel
        this.mode = 'set';
        this.radius = 40000;

        $(window).on('resize', this.onResize.bind(this));

        this.popup = document.createElement('refinery-select-popup');
        document.body.appendChild(this.popup);

        this.parcelPopup = document.createElement('parcel-info-popup');
        document.body.appendChild(this.parcelPopup);
        
        app.setOnCompleteListener(function(){
          setTimeout(function(){
            this.onSelectedUpdated();
          }.bind(this), 200);
        }.bind(this));
      },

      onShow : function() {
        if( this.map ) {
          this.map.invalidateSize();
        }
      },

      toggleSelectedParcels : function() {
        this.showAllParcels = !this.showAllParcels;
        this.filter();
      },

      setMenu : function(ele) {
        this.menu = ele;
        this.menu.setMode(this.mode);
      },

      attached : function() {
        if( !this.map ) {
          L.Icon.Default.imagePath = '/images/leaflet';
          
          this.onResize();
          this.map = L.map(this).setView([44, -121], 6);
          this.map.on('click', this.onClick.bind(this));
          
          L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',{
          //L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(this.map);

          var layer = L.esri.dynamicMapLayer({
            url: 'https://conifer.gis.washington.edu/arcgis/rest/services/AHBNW/AHBNW_20151009_parcel_featureAccess/MapServer',
            opacity: 0.5,
          });

          L.control.layers({}, {Parcels: layer}).addTo(this.map);

          this.canvasLayer = new L.CanvasGeojsonLayer({
            onClick : this.onFeaturesClicked.bind(this)
          });
          this.canvasLayer.renderer = renderer;
          this.canvasLayer.addTo(this.map);
          
          var hash = window.location.hash.replace('#', '').split('/');
          if( hash[0] === 'l' ) {
            console.log(hash);
            var latlng = L.latLng(parseFloat(hash[1]), parseFloat(hash[2]));
            this.setLatLng(latlng);
            setTimeout(() => {
              this.popup.setValues({
                radius : parseFloat(hash[3]),
                refinery : decodeURIComponent(hash[4]),
                tree: hash.length > 4 ? decodeURIComponent(hash[5]) : 'Generic'
              })
            }, 100);
          }
        }
      },

      onResize : function() {
        this.style.height = ($(window).height()-64)+'px';
      },

      onFeaturesClicked : function(features) {
        if( this.mode === 'set' ) return;

        for( var i = 0; i < features.length; i++ ) {
          if( features[i].properties.ucd ) {
            this.parcelPopup.show(features[i]);
            return;
          }
        }
      },

      onClick : function(e) {
        if( this.mode != 'set' ) {
          return;
        }

        this.setLatLng(e.latlng);
      },
      
      setLatLng : function(latlng) {
        this.ll = latlng;

        if( this.marker ) {
          this.map.removeLayer(this.marker);
        }

        this.marker = L.marker(latlng).addTo(this.map);

        this.popup.show(this.ll.lat, this.ll.lng);
      },

      // TODO: bind to this
      // DSSDK.datastore.on('transportation-updated', this.renderRoads);
      onSelectedUpdated : function() {
        this.onParcelsLoaded();

        var cropTypes = {};
        sdk.datastore.validParcels.forEach(function(parcel){
          parcel.properties.ucd.cropInfo.swap.forEach(function(crop){
            cropTypes[crop] = 1;
          });
        });
        this.cropTypes = Object.keys(cropTypes);
        this.filters = [];

        var html = '';
        for( var i = 0; i < this.cropTypes.length; i++ ) {
          html += '<div><input type="checkbox" value="'+this.cropTypes[i]+'" /> '+this.cropTypes[i]+'</div>';
        }

        this.$.filters.innerHTML = html;
        $(this.$.filters)
          .find('input')
          .on('click', function(e){
            var crop = e.currentTarget.getAttribute('value');
            var index = this.filters.indexOf(crop);

            if( e.currentTarget.checked ) {
              if( index === -1 ) {
                this.filters.push(crop);
              }
            } else {
              if( index > -1 ) {
                this.filters.splice(index, 1);
              }
            }

            this.reset();
            this.filter();
          }.bind(this));

        this.filter();
      },

      filter : function() {
        for( var i = this.canvasLayer.features.length-1; i >= 0; i-- ) {
          var type = this.canvasLayer.features[i].type;
          if( type === 'LineString' ){
            this.canvasLayer.features.splice(i, 1);
          }
        }

        // actually hide the parcel at the canvas layer... thus no geometry recalc
        sdk.datastore.validParcels.forEach(function(parcel){
          var isSelected = this.selectedParcel(parcel);

          if( isSelected ) {
            parcel.properties.ucd.render.selected = true;
          } else {
            parcel.properties.ucd.render.selected = false;
          } 

          var clFeature = this.canvasLayer.getCanvasFeatureById(parcel.properties.id);

          if( (isSelected || this.showAllParcels) && this.filteredParcel(parcel) ) {
            clFeature.visible = true;
            parcel.properties.ucd.render.filtered = true;
          } else {
            parcel.properties.ucd.render.filtered = false;
            clFeature.visible = false;
          }

          clFeature.adoptionPricePercentile = parcel.properties.ucd.adoptionPricePercentile;

        }.bind(this));

        this.currentNetwork = {};
        sdk.datastore.validParcels.forEach(function(parcel){
          if( !parcel.properties.ucd.render.selected ) {
            return
          }
          if( !parcel.properties.ucd.render.filtered ) {
            return;
          }
          if( parcel.properties.ucd.transportation.error ) {
            return;
          }

          // set the current network
          var path = parcel.properties.ucd.transportation.path;
          if( !path ) {
            return;
          }
          
          path.forEach(function(id){
            if( this.currentNetwork[id] === undefined ) {
              this.currentNetwork[id] = 1;
            } else {
              this.currentNetwork[id]++;
            }
          }.bind(this));
          

          // render a line for shortest path vertex to feature centroid
          var f = sdk.datastore.network[path[0]];
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
            console.log(feature);
            return;
          }

          var clFeature = new L.CanvasFeature(feature);
          clFeature.lineType = 'start';
          this.canvasLayer.addCanvasFeature(clFeature);
        }.bind(this));

        for( var id in this.currentNetwork ) {
          var feature = sdk.datastore.network[id];
          if( feature.properties.error ) {
            return;
          }
          
          this.canvasLayer.addCanvasFeature(new L.CanvasFeature(feature));
        }

        this.menu.updateSelected();
        this.canvasLayer.render();
      },

      selectedParcel : function(parcel) {
        if( sdk.datastore.selectedParcels.indexOf(parcel) === -1 ) {
          return false;
        }
        return true;
      },

      filteredParcel : function(parcel) {
        if( !parcel.properties.ucd.cropInfo ) {
          return false;
        }

        if( this.filters.length === 0 ) {
          return true;
        }

        for( var i = 0; i < parcel.properties.ucd.cropInfo.swap.length; i++ ) {
          if( this.filters.indexOf(parcel.properties.ucd.cropInfo.swap[i]) > -1 ) {
            return true;
          }
        }

        return false;
      },

      reset : function() {
        this.canvasLayer.removeAll();
        this.canvasLayer.addCanvasFeatures(L.CanvasFeatureFactory(sdk.datastore.validParcels));
        this.canvasLayer.render();

        if( sdk.datastore.validParcels.length > 0 ) {
          this.mode = 'select';
          this.menu.setMode(this.mode);
          this.$.info.style.display = 'block';
        }
      },

      onParcelsLoaded : function() {
        this.reset();
        this.menu.updateSelected();
      },

      onParcelQueryUpdate : function(percent) {
        this.popup.updateStatus(percent);
      },

      setMode : function(mode) {
        this.mode = mode;
      }
    });
