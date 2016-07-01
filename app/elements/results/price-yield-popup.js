var sdk = require('../sdk');

   Polymer({
      is: 'price-yield-popup',
      ready : function() {
        this.data = [];
        this.popup = $(this.$.popup).remove();
        $('body').append(this.popup);
        this.popup.modal({
          show: false
        });
      },

      show : function() {
        this.popup.modal('show');
        this.render();
      },

      hide : function() {
        this.popup.modal('hide');
      },

      render : function() {
        var array = [];
        var priceYield = sdk.collections.crops.priceYield;

        for( var crop in priceYield.data ) {
          array.push({
            crop : crop,
            price : {
              value : priceYield.currentValues[crop].price.price,
              min : priceYield.factored[crop].min.price.price,
              max : priceYield.factored[crop].max.price.price,
              average : priceYield.factored[crop].average.price.price,
              units : priceYield.currentValues[crop].price.unit
            },
            yield : {
              value : priceYield.currentValues[crop].yield.yield,
              min : priceYield.factored[crop].min.yield.yield,
              max : priceYield.factored[crop].max.yield.yield,
              average : priceYield.factored[crop].average.yield.yield,
              units : priceYield.currentValues[crop].yield.unit
            }
          });
        }

        this.data = array;
      },

      fireChange : function(e) {
        var value = parseFloat(e.currentTarget.value);
        var crop = e.currentTarget.getAttribute('crop');
        var type = e.currentTarget.getAttribute('ctype');

        this.fire('yield-price-change',{
          value : value,
          crop : crop,
          type : type
        })
      },

      setMin : function() {
        sdk.collections.crops.setPriceAndYield('min');
        this.render();
        this.fire('yield-price-change',{});
      },

      setMax : function() {
        sdk.collections.crops.setPriceAndYield('max');
        this.render();
        this.fire('yield-price-change',{});
      },

      setAverage : function() {
        sdk.collections.crops.setPriceAndYield('average');
        this.render();
        this.fire('yield-price-change',{});
      }

    })