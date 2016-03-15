var config;

module.exports = {
  get : function() {
    return config;
  },
  set : function(c) {
    config = c;
  }
};
