var ChartBehavior = {
  ready : function() {
    window.addEventListener('resize', this.resize.bind(this));
    this.resizeTimer = -1;
  },

  resize : function() {
    if( this.resizeTimer !== -1 ) {
      clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = setTimeout(function(){
      this.resizeTimer = -1;
      this.redraw();
    }.bind(this), 300);
  },

  redraw : function() {
    if( !this.chartInfo ) return;
    // this.chartInfo.ele.style.width = this.parentElement.offsetWidth + 'px';
    this.chartInfo.chart.draw(this.chartInfo.data, this.chartInfo.options);
  },

  draw : function(data, options, type, ele) {
    if( this.chartInfo ) {
      this.chartInfo.chart.draw(data, options);
      this.chartInfo.data = data;
      this.chartInfo.options = options;
      return;
    }

    var chart = new google.visualization[type](ele);
    chart.draw(data, options);

    this.chartInfo = {
      ele : ele,
      chart : chart,
      data : data,
      options : options
    }
  }


}

module.exports = ChartBehavior;