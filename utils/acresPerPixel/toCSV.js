var readline = require('readline');
var fs = require('fs');
var stringify = require('csv-stringify');
var async = require('async');

var stream = fs.createWriteStream('./results.csv');
stream.write('pid,x,y,north,east,acres\n');

var rl = readline.createInterface({
  input: fs.createReadStream('./results.txt')
});

rl.on('line', (line) => {
  line = JSON.parse(line);
  stream.write(`${line.pid},${line.x},${line.y},${line.north},${line.east},${line.sum.toFixed(4)}\n`);
});

rl.on('close', () => {
  stream.close();
  console.log('done');
});