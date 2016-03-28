var fs = require('fs');
var parse = require('csv-parse');

module.exports = function(file, callback) {
  var input = fs.readFileSync(file, 'utf-8');
  parse(input, {comment: '#'}, callback);
};
