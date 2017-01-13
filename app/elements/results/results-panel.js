var app = require('../app');
var utils = require('../utils');
var async = require('async');
var tokml = require('tokml');

    Polymer({
      is: 'results-panel',

      properties : {
        active : {
          type : Boolean,
          observer : 'onShow'
        }
      },

      behaviors : [EventBusBehavior],

      ebBind : {
        'optimize-start' : 'onOptimizeStart',
        'optimize-update' : 'onOptimizeUpdate',
        'results-summary-end' : 'onOptimizeEnd',
        'refinery-model-run-complete' : 'update'
      },

      ready : function() {
        this.charts = {};
        this.resizeTimer = -1;

        // app.on('poplar-price-update', this.onPriceRecalc.bind(this));

        this.charts = [
          this.$.adoptionCompetingPieChart,
          this.$.adoptionCropPieChart,
          this.$.adoptionPriceChart,
          this.$.adoptionYieldPriceChart
        ];
      },

      onOptimizeStart : function() {
        this.$.updateOverlay.style.display = 'block';
        this.$.updateOverlay.innerHTML = `Calculating %0 ...`; 
      },

      onOptimizeUpdate : function(p) {
        p = (p * 100).toFixed(0);
        this.$.updateOverlay.innerHTML = `Calculating %${p} ...`; 
      },

      onOptimizeEnd : function() {
        this.$.updateOverlay.style.display = 'none';
        this.update();
      },

      onShow : function() {
        if( !this.active ) return;

        this.charts.forEach(function(chart){
          chart.redraw();
        });
      },

      getData : function(callback) {
        this.ebChain(
          [
            'get-selected-refinery',
            'get-refinery-parameters',
            'get-selected-tree',
            'get-parcels-summary',
            'get-growth-time',
            'get-transportation-total-cost',
            'get-parcels-refinery-gate-price'
          ],
          (results) => {
            callback.apply(this, results);
          }
        )
      },

      update : function() {
        this.getData(this._update);
      },
      
      _update : function(refinery, refineryQuery, treeName, parcelSummary, growthTime, transportationCost, parcelsRefineryGatePrice) {

        var url = `${window.location.protocol}//${window.location.host}/#l/${refineryQuery.lat.toFixed(4)}/${refineryQuery.lng.toFixed(4)}/${refineryQuery.radius}/${encodeURIComponent(refinery.name)}/${encodeURIComponent(treeName)}`;
        this.$.runLink.setAttribute('href', url);
        this.$.runLink.innerHTML = url;
        
        this.$.parcelCount.innerHTML = parcelSummary.selectedCount + ' adopted, ' +parcelSummary.validCount + ' available';
        
        if( parcelSummary.mwa === -1 ) {
          this.$.farmersMWA.innerHTML = '<span style="color:red">Unable to calculate</span>';
        } else {
          this.$.farmersMWA.innerHTML = '$'+parcelSummary.mwa+'/Mg';
        }

        this.$.poplarPriceInput.value = refinery.poplarPrice;
        this.$.scaledPrice.innerHTML = (refinery.slidingPoplarPriceTotal / parcelSummary.selectedCount).toFixed(2);
        this.$.refineryMWP.innerHTML = refinery.maxWillingToPay.toFixed(2);

        // TODO
        this.$.adoptionCompetingPieChart.render(parcelSummary, refinery);

        // render overview data
        // this.$.runtime.innerHTML = '('+parcelSummary.years+' Years)';
        this.$.acreCount.innerHTML = utils.formatAmount(parcelSummary.acres)+' adopted';
        
        var yieldRequired = refinery.feedstockCapacity.value;
        var actualYield;
        var html = utils.formatAmount(parcelSummary.avgYearHarvest)+' Mg.<br /><span class="style-scope results-panel ';
        if( parcelSummary.avgYearHarvest < yieldRequired ) {
          actualYield = parcelSummary.avgYearHarvest
          html += 'text-danger';
        } else {
          actualYield = yieldRequired;
          html += 'text-success';
        }
        html += '">'+utils.formatAmount(yieldRequired)+' Mg required to run refinery</span>';
        this.$.avgPerYear.innerHTML = html;
        this.$.avgYield.innerHTML = (parcelSummary.avgYearHarvest / parcelSummary.acres).toFixed(2)+' Mg';
        
        // render refinery data
        var poplarCost = refinery.utils.poplarCost(actualYield, refinery.poplarPrice, growthTime);
 
        var refineryIncome = refinery.utils.income(actualYield, refinery, parcelSummary.years);
        var operatingCost = refinery.operatingCost.value * growthTime;

        this.$.refineryType.innerHTML = refinery.name;
        this.$.refineryCapitalCost.innerHTML = '$'+utils.formatAmount(refinery.capitalCost);
        this.$.refineryOperatingCost.innerHTML = '$'+utils.formatAmount(operatingCost);
        this.$.refineryPoplarCost.innerHTML = '$'+utils.formatAmount(poplarCost);
        this.$.refineryTransportationCost.innerHTML = '$'+utils.formatAmount(transportationCost);
        var totalCost = refinery.capitalCost + operatingCost + poplarCost;
        this.$.refineryTotalCost.innerHTML = '$'+utils.formatAmount(totalCost);
        this.$.refineryProduct.innerHTML = refinery.product.name;
        this.$.refineryIncome.innerHTML = '$'+utils.formatAmount(refineryIncome)+
                                           `<div class="help-block style-scope results-panel">
                                              (${refinery.yield.value} ${refinery.yield.units}) x
                                              (${refinery.product.price} ${refinery.product.units}) x
                                              (${utils.formatAmount(actualYield)} Mg) x
                                              (${growthTime} years)
                                           </div>`;
        
        var net = refineryIncome - (totalCost);
        css = 'danger';
        if( net > 0 ) var css = 'success';
        
        var roiResult = refinery.currentRoi(actualYield);
        var roi = roiResult.roi.toFixed(2);
        var presentValue = roiResult.presentValue.toFixed(2);
        
        this.$.refineryPresentValue.innerHTML = '$'+utils.formatAmount(parseFloat(presentValue));
        this.$.ror.value = parseFloat((refinery.ROR * 100).toFixed(2));
        this.$.maxPastureLand.value = parseFloat((refinery.maxPastureLandAdoption * 100).toFixed(2));
        
        this.$.refineryRor.innerHTML = `%${roi}`;

        this.$.adoptionAmount.innerHTML = ' @ $'+refinery.poplarPrice+' / Mg';
        this.$.adoptionCropPieChart.render(parcelSummary, refinery);

        this.renderBreakdown(refinery, parcelsRefineryGatePrice, growthTime);
      },

      renderBreakdown : function(refinery, refineryGatePrice, growthTime) {
        var crops = {};
        var priceData = [];
        var parcel, crop, item;

        for( var price = refineryGatePrice.min; price <= refinery.maxWillingToPay; price += 0.5 ) {
          item = {
            price : price,
            poplar : {
              acres : 0,
              yield : 0
            }
          };
          priceData.push(item);
        }

        var count = 0;
        function handleIterator(next) {
          if( count % 10 === 0 ) {
            setTimeout(function(){
              next();
            }, 0);
          } else {
            next();
          }
        }

        this.getValidParcelIds((validIds) => {

          async.eachSeries(
            validIds,
            (id, next) => {
              count++;

              this.getParcelInformation(id, (parcel, growthProfile) => {
                if( parcel.properties.ucd.pastureIgnored ) {
                  return handleIterator(next);
                }

                var item;
                for( var i = 0; i < priceData.length; i++ ) {
                  item = priceData[i];

                  if( item.price >= parcel.properties.ucd.refineryGateCost ) {
                    item.poplar.acres += parcel.properties.usableSize;
                    item.poplar.yield += growthProfile.data.totalPerAcre * parcel.properties.usableSize;
                  } else {
                    crop = parcel.properties.ucd.cropInfo.swap.join(', ');
                    if( !crops[crop] ) {
                      crops[crop] = 1;
                    }
                    if( !item[crop] ) {
                      item[crop] = parcel.properties.usableSize;
                    } else {
                      item[crop] += parcel.properties.usableSize;
                    }
                  }
                }

                return handleIterator(next);
              }); // get parcel

            },
            () => {
              this.onPriceDataReady(priceData, crops, refinery, growthTime);
            }
          );
        });
      },

      getValidParcelIds : function(callback) {
        this._eventBus.emit('get-valid-parcel-ids', {handler: callback});
      },

      getParcelInformation : function(id, callback) {
        this.ebChain([
                {event: 'get-parcel', payload: {id}},
                {event: 'get-growth', stream: {id : (results) => results[0].properties.ucd.modelProfileId}}
            ],
            (result) => {
              callback.apply(this, result);
            }
        );
      },

      onPriceDataReady : function(priceData, crops, refinery, growthTime) {
        this.$.adoptionPriceChart.render(priceData, crops, refinery);
        this.$.adoptionYieldPriceChart.render(priceData, refinery, growthTime);
      },

      onPriceChange : function() {
        var options = {
            setPoplarPrice : parseFloat(this.$.poplarPriceInput.value)
        }

        this._eventBus.emit('optimize-refinery', options);
      },

      onRorChange : function() {
        var newRor = parseFloat(this.$.ror.value / 100);
        this._eventBus.emit('set-selected-refinery-ror', newRor);
        this._eventBus.emit('optimize-refinery', {});
      },

      onMaxPastureLandChange : function() {
        var maxPastureLand = parseFloat(this.$.maxPastureLand.value / 100);
        this._eventBus.emit('set-selected-refinery-max-pasture-land', newRor);
        this._eventBus.emit('optimize-refinery', {});
      },
      
      onPriceRecalc : function() {
        this.update();
      },

      onPriceYieldChange : function(e) {
        e = e.detail;

        if( e.crop ) {
          this._eventBus.emit('set-price-yield-value', e)
        }

        this._eventBus.emit('optimize-refinery', {});
      },

      setPoplarPrice : function(price) {
        this.$.poplarPriceInput.value = price;
      },

      _getJsonExport : function(callback) {
        this._eventBus.emit('export-json', {handler: callback});
      },

      exportJson : function() {
        this._getJsonExport((data) => {
          var filename = 'export.json'

          if(typeof data === "object"){
              data = JSON.stringify(data);
          }

          var blob = new Blob([data], {type: 'text/json'}),
              e    = document.createEvent('MouseEvents'),
              a    = document.createElement('a')

          a.download = filename;
          a.href = window.URL.createObjectURL(blob);
          a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
          e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
          a.dispatchEvent(e);
        });
      },

      exportKml : function() {
        this._getJsonExport((data) => {
          var filename = 'export.kml'

          data.parcels.features.forEach((p) => {
            p.type = 'Feature';

            p.properties.stroke = '#ffffff';
            p.properties['stroke-opacity'] = 0;
            p.properties['stroke-width'] = 0;

            if( p.properties.ucd.pastureIgnored ) {
              p.properties.fill = '#ff0000';
              p.properties['fill-opacity'] = 0.6;
            } else if( p.properties.ucd.aboveRefineryWillingToPay ) {
              p.properties.fill = '#ff'+(165).toString(16)+'00';
              p.properties['fill-opacity'] = 0.6;
            } else {
                var a = p.properties.ucd.adoptionPricePercentile;
                var v = Math.floor(200 * (1-a));
                var v2 = Math.floor(200 * a);

                v = (v).toString(16);
                v2 = (v2).toString(16)

                if( v.length === 1 ) v = '0'+v;
                if( v2.length === 1 ) v = '0'+v2;

                p.properties.fill = '#00'+v2+v;
                p.properties['fill-opacity'] = 0.8;
            }
          });

          var kml = tokml(data.parcels, {
            simplestyle : true
          });

          var blob = new Blob([kml], {type: 'application/vnd.google-earth.kml+xml'}),
              e    = document.createEvent('MouseEvents'),
              a    = document.createElement('a')

          a.download = filename;
          a.href = window.URL.createObjectURL(blob);
          a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
          e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
          a.dispatchEvent(e);
        });
      }

    });