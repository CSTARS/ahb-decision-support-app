var app = require('../app');
var sdk = require('../sdk');
var utils = require('../utils');
var async = require('async');
var tokml = require('tokml');

    Polymer({
      is: 'results-panel',

      ready : function() {
        this.breakdownRendered = false;
        this.charts = {};
        this.resizeTimer = -1;
        app.setOnCompleteListener(this.update.bind(this));
        app.on('poplar-price-update', this.onPriceRecalc.bind(this));
        $(window).on('resize', this.resize.bind(this));

        this.removeChild(this.$.updateOverlay);
        document.body.appendChild(this.$.updateOverlay);

        sdk.eventBus.on('optimize-start',() => {
          this.$.updateOverlay.style.display = 'block';
          this.$.updateOverlay.innerHTML = `Calculating %0 ...`; 
        });
        sdk.eventBus.on('optimize-update', (p) => {
          p = (p * 100).toFixed(0);
          this.$.updateOverlay.innerHTML = `Calculating %${p} ...`; 
        });
        sdk.eventBus.on('results-summary-end',() => {
          this.$.updateOverlay.style.display = 'none';
          this.update();
        });
      },

      resize : function() {
        if( this.resizeTimer !== -1 ) {
          clearTimeout(this.resizeTimer);
        }

        this.resizeTimer = setTimeout(function(){
          this.resizeTimer = -1;
          this._resize();
        }.bind(this), 100);
      },

      _resize : function() {
        var w = $(this).width();

        for( var key in this.charts ) {
          var c = this.charts[key];
          c.chart.draw(c.data, c.options);
        }
      },

      onShow : function() {
        this.resize();
      },

      update : function() {
        var refineryController = sdk.controllers.refinery;
        var parcelCollection = sdk.collections.parcels;
        var refinery = sdk.collections.refineries.selected;

        var url = `${window.location.protocol}//${window.location.host}/#l/${refineryController.lat.toFixed(4)}/${refineryController.lng.toFixed(4)}/${refineryController.radius}/${encodeURIComponent(refinery.name)}/${encodeURIComponent(sdk.collections.growthProfiles.selectedTree)}`;
        this.$.runLink.setAttribute('href', url);
        this.$.runLink.innerHTML = url;
        
        this.$.parcelCount.innerHTML = parcelCollection.selectedCount + ' adopted, ' +parcelCollection.validCount + ' available';
        
        if( parcelCollection.mwa === -1 ) {
          this.$.farmersMWA.innerHTML = '<span style="color:red">Unable to calculate</span>';
        } else {
          this.$.farmersMWA.innerHTML = parcelCollection.mwa;
        }

        this.$.poplarPriceInput.value = refinery.poplarPrice;
        this.$.scaledPrice.innerHTML = (refinery.slidingPoplarPriceTotal / parcelCollection.selectedCount).toFixed(2);
        this.$.refineryMWP.innerHTML = refinery.maxWillingToPay.toFixed(2);

        this.$.adoptionCompetingPieChart.render(parcelCollection, refinery);

        // render overview data
        var totals = sdk.collections.parcels.summary;
        
        this.$.runtime.innerHTML = '('+totals.years+' Years)';
        this.$.acreCount.innerHTML = utils.formatAmount(totals.acres)+' adopted';
        var harvestTotal = utils.formatAmount(totals.harvested);
        this.$.harvestTotal.innerHTML = harvestTotal+' Mg';
        
        var yieldRequired = refinery.feedstockCapacity.value;
        var actualYield;
        var html = utils.formatAmount(totals.avgYearHarvest)+' Mg.<br /><span class="style-scope results-panel ';
        if( totals.avgYearHarvest < yieldRequired ) {
          actualYield = totals.avgYearHarvest
          html += 'text-danger';
        } else {
          actualYield = yieldRequired;
          html += 'text-success';
        }
        html += '">'+utils.formatAmount(yieldRequired)+' Mg required to run refinery</span>';
        this.$.avgPerYear.innerHTML = html;
        this.$.avgYield.innerHTML = (totals.avgYearHarvest / totals.acres).toFixed(2)+' Mg';
        
        // render refinery data
        var years = sdk.collections.growthProfiles.years;

        var poplarCost = refinery.utils.poplarCost(actualYield, refinery.poplarPrice, years);
        var transportationCost = sdk.collections.transportation.totalCost;

 
        var refineryIncome = refinery.utils.income(actualYield, refinery, totals.years);
        var operatingCost = refinery.operatingCost.value * years;

        
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
                                              (${years} years)
                                           </div>`;
        
        var net = refineryIncome - (totalCost);
        css = 'danger';
        if( net > 0 ) var css = 'success';
        
        var roiResult = refinery.currentRoi(actualYield);
        var roi = roiResult.roi.toFixed(2);
        var presentValue = roiResult.presentValue.toFixed(2);

        //var ror = Math.pow( (net / refinery.capitalCost ), (1 / years) ) - 1;
        //ror = (ror * 100).toFixed(2);
        
        this.$.refineryPresentValue.innerHTML = '$'+utils.formatAmount(parseFloat(presentValue));
        this.$.ror.value = parseFloat((refinery.ROR * 100).toFixed(2));
        this.$.maxPastureLand.value = parseFloat((refinery.maxPastureLandAdoption * 100).toFixed(2));
        
        this.$.refineryRor.innerHTML = `%${roi}`;

        this.$.adoptionAmount.innerHTML = ' @ $'+refinery.poplarPrice+' / Mg';
        this.$.adoptionCropPieChart.render(totals, refinery);

        this.updatePriceBreakdown();
      },

      drawChart : function(name, data, options, ele, type) {
        if( this.charts[name] ) {
          this.charts[name].chart.draw(data, options);
          this.charts[name].data = data;
          this.charts[name].options = options;
          return;
        }

        var chart = new google.visualization[type](ele);
        chart.draw(data, options);

        this.charts[name] = {
          chart : chart,
          data : data,
          options : options
        }
      },

      updatePriceBreakdown : function() {
        if( !this.breakdownRendered ) {
          this.renderBreakdown();
        } else {
          this.renderBreakdown();
        }
      },
      
      renderBreakdown : function() {
        var parcelsCollections = sdk.collections.parcels;
        
        var crops = {};
        var priceData = [];
        var parcel, crop, item;
        
        var refineryGatePrice = parcelsCollections.refineryGatePrice;

        for( var price = refineryGatePrice.min; price <= sdk.collections.refineries.selected.maxWillingToPay; price += 0.5 ) {
          item = {
            price : price,
            poplar : {
              acres : 0,
              yield : 0
            }
          };
          priceData.push(item);
        }

        async.eachSeries(
          parcelsCollections.validIds,
          (id, next) => {

            parcelsCollections.get(id, (parcel) => {
              if( parcel.properties.ucd.pastureIgnored ) {
                return next();
              }

              sdk.collections.growthProfiles.get(parcel.properties.ucd.modelProfileId, (growthProfile) => {

                var item;
                for( var i = 0; i < priceData.length; i++ ) {
                  item = priceData[i];
              
                //JM
                  if( item.price >= parcel.properties.ucd.refineryGateCost ) {
                  //if( item.price >= parcel.properties.ucd.adoptionPrice ) {
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

                next();

              }); // get growth profile
            }); // get parcel

          },
          () => {
            this.onPriceDataReady(priceData, crops);
          }
        );
      },

      onPriceDataReady : function(priceData, crops) {
        this.$.adoptionPriceChart.render(priceData, crops);
        this.renderYieldAdoption(priceData);
      },
      
      renderYieldAdoption : function(priceData) {
        this.$.adoptionYieldPriceChart.render(priceData);
        this.breakdownRendered = true;
      },

      onPriceChange : function() {
        app.setPoplarPrice(parseFloat(this.$.poplarPriceInput.value));
      },

      onRorChange : function() {
         app.setRor(parseFloat(this.$.ror.value / 100));
      },

      onMaxPastureLandChange : function() {
         app.setMaxPastureLand(parseFloat(this.$.maxPastureLand.value / 100));
      },
      
      onPriceRecalc : function() {
        this.breakdownRendered = false;
        this.update();
      },

      onPriceYieldChange : function(e) {
        e = e.detail;
        if( e.crop ) {
          sdk.collections.crops.priceYield.currentValues[e.crop][e.type][e.type] = e.value;
        }

        this.breakdownRendered = false;
        sdk.controllers.refinery.optimize();
      },

      setPoplarPrice : function(price) {
        this.$.poplarPriceInput.value = price;
      },

      exportJson : function() {
        var data = sdk.controllers.export.toJson();
        // this.$.exportJsonFormData.value = JSON.stringify(data.parcels) + '\n' + JSON.stringify(data.growthProfiles);
        // this.$.exportJsonForm.submit();

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
      },

      exportKml : function() {
        var data = sdk.controllers.export.toJson();
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
      }
    });