var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('results.txt')
});

var sum = 0;
lineReader.on('line', function (line) {
  sum += JSON.parse(line).sum;
});
lineReader.on('close', () => {
	console.log(sum);
});
