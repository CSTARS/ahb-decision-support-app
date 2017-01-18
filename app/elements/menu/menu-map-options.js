Polymer({
  is: 'menu-map-options',

  behaviors : [EventBusBehavior],

  ebBind : {
    'set-map-mode' : 'onModeUpdated'
  },

  onModeUpdated : function(mode) {
    this.mode = mode;
    if( this.mode === 'set' ) {
      this.$.mode.checked = true;
    } else {
      this.$.mode.checked = false;
    }
  },

  updateMode : function() {
    this.mode = this.$.mode.checked ? 'set' : 'select';
    this._eventBus.emit('set-map-mode', this.mode);
  },

  setInfo : function(lat, lng, radius) {
    this.$.info.style.display = 'block';
    this.$.ll.innerHTML = lat.toFixed(4)+', '+lng.toFixed(4);
    this.$.radius.innerHTML = radius/1000+'km';
  }
});