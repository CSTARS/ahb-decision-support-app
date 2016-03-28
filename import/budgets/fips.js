var data = {
  6 : 'california',
  16 : 'idaho',
  53 : 'washington',
  41 : 'oregon'
};

module.exports = function(code) {
  return data[parseInt(code)];
};
