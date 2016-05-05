var app = require('../app');
var sdk = require('../sdk');


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
        this.rand = 0.8;

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
          L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(this.map);

          var layer = L.esri.dynamicMapLayer({
            url: 'https://conifer.gis.washington.edu/arcgis/rest/services/AHBNW/AHBNW_20151009_parcel_featureAccess/MapServer',
            opacity: 0.5,
          });

          L.control.layers({}, {Parcels: layer}).addTo(this.map);

          this.canvasLayer = new L.CanvasGeojsonLayer({
            /*,onMouseOver : function(features) {
              //markerSelector.hover(features);
              //updateMouse(markerLayer._container, markerLayer.intersectList);
            }.bind(this)
            onMouseOut : function(features) {
              markerSelector.nohover(features);
              updateMouse(markerLayer._container, markerLayer.intersectList);
            }.bind(this),*/
            onClick : this.onFeaturesClicked.bind(this)
          });
          this.canvasLayer.addTo(this.map);
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

        this.ll = e.latlng;

        if( this.marker ) {
          this.map.removeLayer(this.marker);
        }

        this.marker = L.marker(e.latlng).addTo(this.map);

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
          var geo = this.canvasLayer.features[i].geojson.geometry;
          if( geo.type === 'LineString' ){
            this.canvasLayer.features.splice(i, 1);
          }
        }

        // actually hide the parcel at the canvas layer... thus no geometry recalc
        this.canvasLayer.features.forEach(function(clFeature){
          var isSelected = this.selectedParcel(clFeature.geojson);

          if( isSelected ) {
            clFeature.geojson.properties.ucd.render.selected = true;
          } else {
            clFeature.geojson.properties.ucd.render.selected = false;
          }

          if( (isSelected || this.showAllParcels) && this.filteredParcel(clFeature.geojson) ) {
            clFeature.visible = true;
            clFeature.geojson.properties.ucd.render.filtered = true;
          } else {
            clFeature.geojson.properties.ucd.render.filtered = false;
            clFeature.visible = false;
          }
        }.bind(this));

        this.currentNetwork = {};
        sdk.datastore.validParcels.forEach(function(parcel){
          if( !parcel.properties.ucd.render.selected ) {
            return
          }
          if( !parcel.properties.ucd.render.filtered ) {
            return;
          }
          if( parcel.properties.ucd.transportation.properties.error ) {
            return;
          }

          // set the current network
          var path = parcel.properties.ucd.transportation.properties.path;
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

          this.canvasLayer.addFeature({
            geojson : feature,
            render : this.lineRenderer.bind(this)
          });
        }.bind(this));

        for( var id in this.currentNetwork ) {
          var feature = sdk.datastore.network[id];
          if( feature.properties.error ) {
            return;
          }
          this.canvasLayer.addFeature({
            geojson : feature,
            render : this.lineRenderer.bind(this)
          });
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
        this.canvasLayer.features = [];

        sdk.datastore.validParcels.forEach(function(parcel){
          this.canvasLayer.addFeature(this.canvasLayerFeature(parcel));
        }.bind(this));

        this.canvasLayer.render();

        if( sdk.datastore.allParcels.length > 0 ) {
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

      canvasLayerFeature : function(parcel) {
        if( !parcel.properties.ucd.render ) {
          parcel.properties.ucd.render = {};
        }

        return {
          geojson : parcel,
          render : this.polyRenderer.bind(this),
          visible : false
        };
      },

      polyRenderer : function(ctx, xyPoints, map, feature) {
        var render = feature.geojson.properties.ucd.render;

        if( feature.geojson.geometry.type === 'MultiPolygon' ) {
          xyPoints.forEach(function(points){
            this.drawPolygon(ctx, points, feature);
          }.bind(this));
        } else {
          this.drawPolygon(ctx, xyPoints, feature);
        }
      },

      drawPolygon : function(ctx, xyPoints, feature) {
        var point;
        if( xyPoints.length <= 1 ) {
          console.log('1 point path!');
          return;
        }

        ctx.beginPath();

        point = xyPoints[0];
        ctx.moveTo(point.x, point.y);
        for( var i = 1; i < xyPoints.length; i++ ) {
          ctx.lineTo(xyPoints[i].x, xyPoints[i].y);
        }
        ctx.lineTo(xyPoints[0].x, xyPoints[0].y);

        if( feature.geojson.properties.ucd.transportation.properties.error || feature.geojson.properties.ucd.poplarGrowthError ) {
          ctx.strokeStyle = 'rgba(255,0,0,.8)';
        } else if( !feature.geojson.properties.ucd.render.selected ) {
          ctx.strokeStyle = 'rgba(255, 152, 0,.8)';
        } else {
          ctx.strokeStyle = '#00BCD4';
        }

        ctx.lineWidth = 3;
        ctx.stroke();

        if( !feature.geojson.properties.ucd.render.selected ) {
          ctx.fillStyle = 'rgba(255,255,255,.8)';
        } else {
          ctx.fillStyle = 'rgba(0,188,212,.3)';
        }

        ctx.fill();
      },

      lineRenderer : function(ctx, xyPoints, map, feature) {
        var point, last;
        if( xyPoints.length <= 1 ) return;

        ctx.beginPath();

        point = xyPoints[0];
        ctx.moveTo(point.x, point.y);
        last = point;
        for( var i = 1; i < xyPoints.length; i++ ) {
          point = xyPoints[i];
          if( point.x === last.x && point.y === last.y ) {
            continue;
          }
          ctx.lineTo(point.x, point.y);
          last = point;
        }

        if( feature.geojson.properties.type === 'start') {
          // ctx.strokeStyle = 'rgba(200,200,200,.8)';
          ctx.strokeStyle = '#CFD8DC';
          ctx.lineCap = 'round';
        } else {
          var use = sdk.datastore.networkUse[feature.geojson.properties.id];
          var p = use / sdk.datastore.maxNetworkUse;

          ctx.strokeStyle = '#607D8B';
          // if( p < 0.10 ) {
          //   ctx.strokeStyle = 'rgba(76,175,80,.8)';
          // } else if ( p > 0.30 ) {
          //   ctx.strokeStyle = 'rgba(229,28,35,.6)';
          // } else {
          //   ctx.strokeStyle = 'rgba(206,229,28,.6';
          // }
        }

        ctx.lineWidth = 3;
        ctx.stroke();
      },

      setMode : function(mode) {
        this.mode = mode;
      }
    });
