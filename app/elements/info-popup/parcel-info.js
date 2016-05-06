var sdk = require('../sdk');
var app = require('../app');

    Polymer({
      is: 'parcel-info',

      properties : {
        parcel : {
          type : Object,
          observer : 'onParcelUpdate'
        },
        parcelId : {
          type : String,
          reflectToAttribute : true
        }
      },

      onParcelUpdate : function() {
        if( !this.parcel ) return;
        this.parcelId = this.parcel.properties.PolyID;

        var name = ['Parcel ID: '+this.parcel.properties.PolyID];
        if( this.parcel.properties.SiteAddressFull && this.parcel.properties.SiteAddressFull.trim() ) {
          name.push(this.parcel.properties.SiteAddressFull);
        }
        if( this.parcel.properties.Township && this.parcel.properties.Township.trim() ) {
          name.push(this.parcel.properties.Township);
        }
        this.$.name.innerHTML = name.join(', ');

        this.$.size.innerHTML = Math.round(this.parcel.properties.GISAcres);
        this.$.potential.innerHTML = Math.floor(this.parcel.properties.PotentiallySuitPctOfParcel*100);
        this.$.asize.innerHTML = Math.round(this.parcel.properties.GISAcres * this.parcel.properties.PotentiallySuitPctOfParcel);

        if( this.parcel.properties.ucd && this.parcel.properties.ucd.modelProfileId ) {
          this.onComplete();
        }
      },

      onComplete : function() {
        if( !this.parcel.properties.ucd.modelProfileId ) return;
        var poplarTotal = this.parcel.properties.ucd.harvest.totalHarvest * sdk.datastore.poplarPrice;

        var label = 'success';
        if( poplarTotal < this.parcel.properties.ucd.crop.total ) {
          label = 'primary';
        } else {
          sdk.datastore.selectParcel(this.parcel);
        }

        setTimeout(this.updateChart.bind(this), 300);
      },

      updateChart : function() {
        if( !this.parcel.properties.ucd.modelProfileId ) return;

        var dt = new google.visualization.DataTable();
        dt.addColumn('string', 'Year'); // Implicit domain label col.
        dt.addColumn('number', '$ Poplar');
        dt.addColumn({type: 'string', role: 'tooltip'});
        dt.addColumn('number', '$ Current Crop(s)');
        dt.addColumn({type: 'string', role: 'tooltip'});

        var id = this.parcel.properties.ucd.modelProfileId;
        var poplarConfig = sdk.poplarModel.profiles[id].config;
        if( !id ) return;
        var d = new Date(poplarConfig.manage.dateCoppiced.getTime());
        var startYear = d.getFullYear();

        var data = [];
        var c = 1;

        var revenueResults = this.parcel.properties.ucd.revenueResults;
        var pR = 0;
        var cR = 0;
        var transportationAvg = 0;
        var tc = 0;

        for( var i = 0; i < revenueResults.poplar.length; i++ ) {
          pR += revenueResults.poplar[i].revenue;
          cR += revenueResults.crops[i].revenue;

          data.push([
            d.getFullYear()+'',
            pR,
            '$'+pR.toFixed(2),
            cR,
            '$'+cR.toFixed(2)
          ]);
          d.setFullYear(d.getFullYear()+1);

          if( revenueResults.poplar[i].transportation ) {
            transportationAvg += revenueResults.poplar[i].transportation;
            tc++;
          }

        }

        if( tc > 0 ) {
          transportationAvg  = transportationAvg / tc;
        }


        dt.addRows(data);
        this.$.duration.innerHTML = (d.getFullYear()-startYear)+' Years';

        var html = '';
        var cropInfo = this.parcel.properties.ucd.cropInfo;
        for( var i = 0; i < cropInfo.swap.length; i++ ) {
          html += '<b>'+cropInfo.swap[i] + '</b><br />'+
          '&nbsp;&nbsp;<b>Cost:</b> $'+cropInfo.cropBudgets[i].budget.total.toFixed(2)+' / Acre - <a href="http://farmbudgets.org/#' +
          cropInfo.cropBudgets[i].id+'" target="_blank"><i class="fa fa-list-alt"></i> Budget Details</a><br />' +
          '&nbsp;&nbsp;<b>Price:</b> '+cropInfo.priceYield[i].price.price+' '+cropInfo.priceYield[i].price.unit+'<br />'+
          '&nbsp;&nbsp;<b>Yield:</b> '+(cropInfo.priceYield[i].yield.yield)+' '+cropInfo.priceYield[i].yield.unit;
        }
        this.$.crops.innerHTML = html;

        if( this.parcel.properties.ucd.harvest.growthError ) {
          this.$.poplar.innerHTML = '<div class="alert alert-danger"><i class="fa fa-warning"></i> Failed to grow poplar :(</div>';
        } else {
          this.$.poplar.innerHTML =
                  '<b>Cost:</b> $'+sdk.datastore.getPoplarTotal().toFixed(2)+' / Acre ' +
                  ' - <a href="http://farmbudgets.org/#'+sdk.budget.getPoplarBudget().getId()+'" target="_blank"><i class="fa fa-list-alt"></i> Budget Details</a></a><br />' +
                  '<b>Price:</b> $'+sdk.datastore.poplarPrice+' / Mg<br />'+
                  '<b>Avg Transportation Cost:</b> $'+transportationAvg.toFixed()+' / Harvest <br />'+
                  '<b>Distance:</b> '+(this.parcel.properties.ucd.transportation.properties.distance*0.621371).toFixed(2)+' mi';
        }

        var options = {
          width : $(this.$.revenueChart).parent().width(),
          height: 300,
          legend : {
            position: 'top'
          },
          hAxis : {
            slantedText:true,
            slantedTextAngle:45
          }
        };
        var chart = new google.visualization.LineChart(this.$.revenueChart);
        chart.draw(dt, options);

        setTimeout(function(){
          options.width = $(this.$.chart).parent().width();
          var chart = new google.visualization.LineChart(this.$.revenueChart);
          chart.draw(dt, options);
        }.bind(this), 500);

        this.updateYieldChart();
      },

      updateYieldChart : function() {
        var dt = new google.visualization.DataTable();
        dt.addColumn('string', 'Year'); // Implicit domain label col.
        dt.addColumn('number', 'Poplar (Mg / Acre)');
        dt.addColumn({type: 'string', role: 'tooltip'});


        var id = this.parcel.properties.ucd.modelProfileId;
        var poplarConfig = sdk.poplarModel.profiles[id].config;
        if( !id ) return;


        var d = new Date(poplarConfig.manage.dateCoppiced.getTime());
        var startYear = d.getFullYear();

        var data = [];
        var c = 1;

        var revenueResults = this.parcel.properties.ucd.revenueResults;


        var crops = [];
        var included = {};
        for( var i = 0; i < revenueResults.crops.length; i++ ) {
          var yearData = revenueResults.crops[i].breakdown;
          for( var j = 0; j < yearData.length; j++ ) {
            if( !included[yearData[j].crop] ) {
              crops.push({
                crop : yearData[j].crop,
                units : yearData[j].yieldUnits
              });
              included[yearData[j].crop] = true;

              dt.addColumn('number', yearData[j].crop+' ('+yearData[j].yieldUnits+')');
              dt.addColumn({type: 'string', role: 'tooltip'});
            }
          }
        }

        for( var i = 0; i < revenueResults.poplar.length; i++ ) {
          var pyield = 0;
          for( var j = 0; j < revenueResults.poplar[i].breakdown.length; j++ ) {
            pyield += revenueResults.poplar[i].breakdown[j].yield;
          }

          var rowdata = [
            d.getFullYear()+'',
            pyield,
            pyield.toFixed(2)+' (Mg / Acre)'
          ];

          var cyield = 0;
          for( var j = 0; j < revenueResults.crops[i].breakdown.length; j++ ) {
            var yearData = revenueResults.crops[i].breakdown;

            crops.forEach(function(cropInfo){
              var d = this.getYearData(cropInfo, yearData);
              rowdata.push(d.yield);
              rowdata.push(d.yield.toFixed(2)+' ('+d.yieldUnits+')');
            }.bind(this));
          }

          data.push(rowdata);
          d.setFullYear(d.getFullYear()+1);
        }

        dt.addRows(data);

        var options = {
          width : $(this.$.yieldChart).parent().width(),
          height: 300,
          legend : {
            position: 'top'
          },
          hAxis : {
            slantedText:true,
            slantedTextAngle:45
          }
        };
        var chart = new google.visualization.ColumnChart(this.$.yieldChart);
        chart.draw(dt, options);

        setTimeout(function(){
          options.width = $(this.$.chart).parent().width();
          var chart = new google.visualization.ColumnChart(this.$.yieldChart);
          chart.draw(dt, options);
        }.bind(this), 500);
      },

      getYearData : function(cropInfo, yearData) {
        for( var i = 0; i < yearData.length; i++ ) {
          if( yearData[i].crop === cropInfo.crop ) {
            return yearData[i];
          }
        }

        return {
          crop : cropInfo.crop,
          yieldUnits : cropInfo.units,
          yield : 0
        }
      }
    });