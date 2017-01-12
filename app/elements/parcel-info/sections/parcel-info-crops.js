Polymer({
  is: 'parcel-info-crops',

  render : function(parcel) {
    this.innerHTML = '';

    var cropInfo = parcel.properties.ucd.cropInfo;
    for( var i = 0; i < cropInfo.swap.length; i++ ) {
      var ele = document.createElement('parcel-info-crop');
      ele.render(parcel.properties.ucd.budgetIds[i], cropInfo.swap[i], cropInfo.fips, cropInfo.pasture);
      this.appendChild(ele);
    }
  }
});