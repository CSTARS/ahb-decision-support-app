var app = require('../app');
var sdk = require('../sdk');
var renderer = require('./utils/renderer');
var FilterBehavior = require('./utils/filter');
var async = require('async');
var states = require('./utils/states');

    Polymer({
      is: 'parcel-map',

      properties : {
        active : {
          type : Boolean,
          observer : 'onShow'
        }
      },

      behaviors : [FilterBehavior],

      ready : function() {
        // map render/filter stuff
        this.filters = [];
        this.showAllParcels = false;
        this.cropTypes = [];

        // current modes are 'set' (set refinery location) or 'select' which is select parcel
        this.mode = 'set';
        this.radius = 40000;

        // this.parcelPopup = document.createElement('parcel-info-popup');
        // document.body.appendChild(this.parcelPopup);
        
        sdk.eventBus.on('refinery-model-run-complete', () => {
          setTimeout(function(){
            this.onSelectedUpdated();
          }.bind(this), 200);
        });
      },

      onShow : function() {
        if( this.map && this.active ) {
          this.debounce('onShow',function(){
            this.map.invalidateSize();
          }, 100);
        }
      },

      toggleSelectedParcels : function() {
        this.showAllParcels = !this.showAllParcels;
        this.filter();
      },

      setMenu : function(ele) {
        this.menu = ele;
        this.menu.setMode(this.mode);
        this.menu.wireEvents(this);
      },

      attached : function() {
        setTimeout(() => {
          this._attached();
        }, 100);
      },

      _attached : function() {
        if( !this.map ) {
          L.Icon.Default.imagePath = '/images/leaflet';
          
          this.map = L.map(this).setView([44, -121], 6);
          this.map.on('click', this.onClick.bind(this));
          
          // var baselayer = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',{
          var baselayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(this.map);


          var layer = L.esri.dynamicMapLayer({
            url: 'https://conifer.gis.washington.edu/arcgis/rest/services/AHBNW/AHBNW_20151009_parcel_featureAccess/MapServer',
            opacity: 0.5,
          });

          var statesLayer = L.geoJson(states, {
            style : function() {
              return {
                  fillColor: "#ffffff",
                  color: "#000",
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 1
              }
            }
          });
          statesLayer.on('click', this.onClick.bind(this));

          L.control.layers({
            Baselayer : baselayer,
            States : statesLayer
          },{
            Parcels: layer
          }).addTo(this.map);

          this.canvasLayer = new L.CanvasGeojsonLayer({
            onClick : this.onFeaturesClicked.bind(this)
          });

          // HACK: adjust the z-index on the default controls
          var controls = this.querySelectorAll('.leaflet-control');
          for( var i = 0; i < controls.length; i++ ) {
            controls[i].style.zIndex = 5;
          }

          this.canvasLayer.renderer = renderer;
          this.canvasLayer.addTo(this.map);
        }
      },

      onFeaturesClicked : function(features) {
        if( this.mode === 'set' ) return;

        for( var i = 0; i < features.length; i++ ) {
          if( features[i].render && features[i].render.isParcel ) {
            window.location.hash = 'parcel/'+features[i].id;
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

        window.location = '#select';
        this.selectPanel.show(this.ll.lat, this.ll.lng);
      },

      // TODO: bind to this
      // DSSDK.datastore.on('transportation-updated', this.renderRoads);
      onSelectedUpdated : function() {
        this.onParcelsLoaded();
      },

      reset : function(callback) {
        this.canvasLayer.removeAll();
        var c = 0;

        var cropTypes = {};

        var clFeature;
        sdk.localdb.forEach(
          'parcels',
          (parcel, next) => {
            c++;
            clFeature = new L.CanvasFeature(parcel, parcel.properties.id);
            this.canvasLayer.addCanvasFeature(clFeature);

            parcel.properties.ucd.cropInfo.swap.forEach(function(crop){
              cropTypes[crop] = 1;
            });

            next();
          },
          () => {
            this.cropTypes = Object.keys(cropTypes);

            this.fire('render-filters', this.cropTypes);

            this.canvasLayer.render();

            if( c > 0 ) {
              this.mode = 'select';
              this.menu.setMode(this.mode);
            }

            if( callback ) callback();
          }
        );
      },

      onParcelsLoaded : function() {
        this.reset();
      },

      onParcelQueryUpdate : function(percent) {
        this.selectPanel.updateStatus(percent);
      },

      setMode : function(mode) {
        this.mode = mode;
      }
    });
