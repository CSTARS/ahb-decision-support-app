var sdk = require('farm-budgets-sdk')({
  //host : 'http://localhost:8000',
  host : 'http://farmbudgets.org',
  token : ''
});

module.exports = function() {
  return sdk;
};
