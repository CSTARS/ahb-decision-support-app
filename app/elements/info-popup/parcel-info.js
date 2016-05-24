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
        
        var size = this.parcel.properties.GISAcres * this.parcel.properties.PotentiallySuitPctOfParcel;
        var poplarAveragePerYear = this.parcel.properties.ucd.harvest.totalHarvest / this.parcel.properties.ucd.harvest.years;
        var poplarAveragePerAcre = poplarAveragePerYear / size;
        

        var revenueResults = this.parcel.properties.ucd.revenueResults;
        var pR = 0;
        var cR = 0;
        var transportationAvg = 0;
        var tc = 0;
        var waterAvg = 0;
        var tw = 0;
        var landAvg = 0;
        var tl = 0;
        
        

        for( var i = 0; i < revenueResults.poplar.length; i++ ) {
          pR += revenueResults.poplar[i].revenue;
          cR += revenueResults.crops[i].revenue;

          data.push([
            d.getFullYear()+'',
            pR,
            '$'+(pR / size).toFixed(2),
            cR,
            '$'+(cR / size).toFixed(2)
          ]);
          d.setFullYear(d.getFullYear()+1);

          if( revenueResults.poplar[i].transportation ) {
            transportationAvg += revenueResults.poplar[i].transportation;
            tc++;
          }
          if( revenueResults.poplar[i].water ) {
            waterAvg += revenueResults.poplar[i].water;
            tw++;
          }
          if( revenueResults.poplar[i].land ) {
            landAvg += revenueResults.poplar[i].land;
            tl++;
          }
        }

        if( tc > 0 ) {
          transportationAvg  = transportationAvg / tc;
        }
        if( tw > 0 ) {
          waterAvg  = waterAvg / tw;
        }
        if( tl > 0 ) {
          landAvg  = landAvg / tl;
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
                  '<b>Avg Water Cost:</b> $'+waterAvg.toFixed()+' / Year ($'+(waterAvg / size).toFixed()+' / Acre)<br />'+
                  '<b>Avg Land Cost:</b> $'+landAvg.toFixed()+' / Year ($'+(landAvg / size).toFixed()+' / Acre)<br />'+
                  '<b>Avg Yield / Year:</b> '+poplarAveragePerYear.toFixed(2)+' Mg <br />'+
                  '<b>Avg Yield / Acre / Year:</b> '+poplarAveragePerAcre.toFixed(2)+' Mg <br />';
        }
        
        var size = this.parcel.properties.GISAcres * this.parcel.properties.PotentiallySuitPctOfParcel;
        
        this.$.transportation.innerHTML =
            '<b>Avg Transportation Cost / Harvest:</b> $'+transportationAvg.toFixed()+'<br />'+
            '<b>Avg Transportation Cost / Acre:</b> $'+(transportationAvg / size).toFixed() +'<br />'+
            '<b>Avg Transportation Cost / Mg:</b> $'+((transportationAvg / size) / poplarAveragePerAcre).toFixed() +'<br />'+
            '<b>Distance:</b> '+(this.parcel.properties.ucd.transportation.distance*0.621371).toFixed(2)+' mi';

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

        var id = this.parcel.properties.ucd.modelProfileId;
        var poplarConfig = sdk.poplarModel.profiles[id].config;
        if( !id ) return;

        this.drawPoplar();
      },
      
      drawPoplar : function() {
        var id = this.parcel.properties.ucd.modelProfileId;
        var alldata = sdk.poplarModel.profiles[id].allData;
        var dt = new google.visualization.DataTable();
        dt.addColumn('string', 'Month');
        dt.addColumn('number', 'Poplar (Mg / Acre)');
        var data = [];
        for( var i = 0; i < alldata.length; i++ ) {
          if( typeof alldata[i][31] === 'string' ) {
            continue;
          }
          data.push([i+'', alldata[i][31] / 2.47105]);
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
        var chart = new google.visualization.LineChart(this.$.poplarChart);
        chart.draw(dt, options);
        
        if( this.parcel.properties.ucd.cropInfo.pasture ) {
          this.$.irrigFrac.innerHTML = 'Not Irrigated: Pasture Land';
          this.$.irrigFrac.className = 'pull-right label label-warning';
        } else {
          this.$.irrigFrac.innerHTML = 'Irrigated';
          this.$.irrigFrac.className = 'pull-right label label-info';
        }
        
        setTimeout(function(){
          options.width = $(this.$.chart).parent().width();
          var chart = new google.visualization.LineChart(this.$.poplarChart);
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