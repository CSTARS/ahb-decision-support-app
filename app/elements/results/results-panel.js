var app = require('../app');
var sdk = require('../sdk');
var utils = require('../utils');
var async = require('async');

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
        
        //this.charts = {};
//        this.$.parcelPercent.innerHTML = Math.floor(100 * ( sdk.datastore.selectedParcelsCount / sdk.datastore.allParcels.length))+'%';
        this.$.validParcelPercent.innerHTML = Math.floor(100 * ( parcelCollection.selectedCount / parcelCollection.validCount))+'%';
        this.$.parcelCount.innerHTML = parcelCollection.selectedCount + ' of ' +parcelCollection.validCount;
        
        if( parcelCollection.mwa === -1 ) {
          this.$.farmersMWA.innerHTML = '<span style="color:red">Unable to calculate</span>';
        } else {
          this.$.farmersMWA.innerHTML = parcelCollection.mwa;
        }

        this.$.poplarPriceInput.value = refinery.poplarPrice;
        this.$.refineryMWP.innerHTML = refinery.maxWillingToPay.toFixed(2);

        this.$.adoptionCompetingPieChart.render(parcelCollection, refinery);

        // render overview data
        var totals = sdk.collections.parcels.summary;
        
        this.$.runtime.innerHTML = '('+totals.years+' Years)';
        this.$.acreCount.innerHTML = utils.formatAmount(totals.acres);
        var harvestTotal = utils.formatAmount(totals.harvested);
        this.$.harvestTotal.innerHTML = harvestTotal+' Mg';
        
        var yieldRequired = refinery.feedstockCapacity.value;
        var actualYield;
        var html = utils.formatAmount(totals.avgYearHarvest)+' Mg.<br /><span class="text ';
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
                                           `<div class="help-block">
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
        var header = ['price', 'poplar'];
        for( var key in crops ) {
          header.push(key);
        }
        
        var data = [], row, rowData;
        var lastPrice = 0;
        var currentPriceNotSet = true;

        var refinery = sdk.collections.refineries.selected;
        
        for( var j = 0; j < priceData.length; j++ ) {
          rowData = priceData[j];
          row = [rowData.price+'', rowData.poplar.acres];
          
          for( var i = 2; i < header.length; i++ ) {
            row.push(rowData[header[i]] || 0);
          }
          
          if( refinery.poplarPrice > lastPrice && refinery.poplarPrice <= rowData.price && currentPriceNotSet ) {
            currentPriceNotSet = false;
            row.push(rowData.poplar.acres);
            row.push('Current Price: '+refinery.poplarPrice+' $ / Mg');
          } else {
            row.push(null);
            row.push(null);
          }
          
          data.push(row);
          lastPrice = rowData.price;
        }
        
        var dt = new google.visualization.DataTable();
        dt.addColumn({id:'price', label: 'Price', type:'string'});
        dt.addColumn({id:'poplar', label: 'Poplar', type:'number'});
        for( var key in crops ) {
          dt.addColumn({id:key, label:key, type:'number'});
        }
        dt.addColumn({id:'Current Price', label:'Current Price', type:'number'});
        dt.addColumn({id: 'tooltip', type: 'string', role: 'tooltip'});
        
        dt.addRows(data);
        
        var options = {
          animation:{
            duration: 1000,
            easing: 'out',
          },
          hAxis : {
            title : 'Price ($)'
          },
          height: 400,
          vAxis : {
            //title : 'Parcels (#)'
            title : 'Acres'
          },
          seriesType: "bars",
          series :{},
          interpolateNulls : true,
          legend : {
            position: 'top'
          }
        }

        for( var i = 0; i < header.length-1; i++ ) {
          options.series[i] = {
            type : 'line',
            targetAxisIndex : 0
          }
        }

        this.drawChart('adoptionChart', dt, options, this.$.adoptionChart, 'ComboChart');
        this.renderYieldAdoption(priceData);
      },
      
      renderYieldAdoption : function(priceData) {
        var dt = new google.visualization.DataTable();

        var data = [];
        var header = ['price', 'poplar', 'required'];
        dt.addColumn({id:'price', label: 'Price', type:'string'});
        dt.addColumn({id:'poplar', label: 'Poplar', type:'number'});
        dt.addColumn({id: 'required', label: 'Required Yield', type: 'number'});
        dt.addColumn({id:'Current Price', label:'Current Price', type:'number'});
        dt.addColumn({id: 'tooltip', type: 'string', role: 'tooltip'});


        var max = 0, lastPrice;
        var row, y, rowData;
        var currentPriceNotSet = true;
        var refinery = sdk.collections.refineries.selected;
        var yieldRequired = refinery.feedstockCapacity.value;
        var years = sdk.collections.growthProfiles.years;
        
        for( var i = 0; i < priceData.length; i++ ) {
          rowData = priceData[i];
          row = [rowData.price+'', rowData.poplar.yield / years, yieldRequired];
          
          if( refinery.poplarPrice > lastPrice && refinery.poplarPrice <= rowData.price && currentPriceNotSet ) {
            currentPriceNotSet = false;
            row.push(rowData.poplar.yield / years);
            row.push('Current Price: '+refinery.poplarPrice+' $ / Mg');
          } else {
            row.push(null);
            row.push(null);
          }
          
          data.push(row);
          lastPrice = rowData.price;
        }

        dt.addRows(data);

        var options = {
          animation:{
            duration: 1000,
            easing: 'out',
          },
          hAxis : {
            title : 'Price ($)'
          },
          height: 400,
          vAxis : {
            title : 'Average Yield / Year'
          },
          seriesType: "bars",
          series :{},
          interpolateNulls : true,
          legend : {
            position: 'top'
          }
        }

        for( var i = 0; i < header.length-1; i++ ) {
          options.series[i] = {
            type : 'line',
            targetAxisIndex : 0
          }
        }

        this.drawChart('renderYieldAdoption', dt, options, this.$.renderYieldAdoption, 'ComboChart');

        this.breakdownRendered = true;
      },

      onPriceChange : function() {
        app.setPoplarPrice(parseFloat(this.$.poplarPriceInput.value));
      },

      onRorChange : function() {
         app.setRor(parseFloat(this.$.ror.value / 100));
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

      // showPriceYieldPopup : function() {
      //   this.$.priceYieldPopup.show();
      // },
      
      exportJson : function() {
        this.$.exportJsonFormData.value = JSON.stringify(sdk.controllers.export.toJson());
        this.$.exportJsonForm.submit();
      }
    });