Polymer({
  is: 'parcel-map-legend',

  behaviors : [EventBusBehavior],

  ebBind : {
    'optimize-end': 'onOptimizeEnd'
  },

  onOptimizeEnd : function() {
    this.debounce('onOptimizeEnd', () => {
      this._getRefineryGatePrice((refineryGatePrice) => {
        this.prices = refineryGatePrice;
        this._onOptimizeEnd();
      }); 
    }, 200);
  },

  _getRefineryGatePrice : function(callback) {
    this.getEventBus().emit('get-parcels-refinery-gate-price', {handler: callback});
  },

  _onOptimizeEnd : function() {
    this.$.legend.innerHTML = '';
    var step = (this.prices.max - this.prices.min) / 10;
    
    var price = this.prices.min;
    for( var i = 0; i < 10; i++ ) {
      var root = document.createElement('div');
      var color = document.createElement('div');
      var label = document.createElement('div');

      root.className = 'layout center';
      color.className = 'legend-color';
      root.appendChild(color);
      root.appendChild(label);

      color.style.backgroundColor = this.getRgbaFromPrice(price);
      label.innerHTML = '$'+price.toFixed(2)+'/Mg';
      price += step;

      Polymer.dom(this.$.legend).appendChild(root);
    }

    this.style.display = 'block';
  },

  getRgbaFromPrice : function(price) {
    var diff = price - this.prices.min;
    if( diff === 0 ) diff = 0.001;
    price = diff / (this.prices.max - this.prices.min);

    var v = Math.floor(200 * (1-price));
    var v2 = Math.floor(200 * price);
    return 'rgba(0,'+v2+','+v+',.8)';
  },

  getOverRgba : function() {
    return 'rgba(255,165,0,.6)';
  }
});