var pg = require('pg');
var conf = require('/etc/willow/pgconf.json');
var conString = `postgres://${conf.username}:${conf.password}@localhost:5433/transportation`;
var client, done;

var p1 = '42.821354,-112.420649';
var p2 = '43.635083,-116.432893';
//var p2 = '42.842111,-112.428610';

pg.connect(conString, function(err, c, d) {
  if(err) {
    return console.error('error fetching client from pool', err);
  }

  client = c;
  done = d;

  run();
});

function run() {
  getNode(p1, function(n1){
    getNode(p2, function(n2){
      console.log(n1);
      console.log(n2);
      var t = new Date().getTime();

      var stmt =
      `select seq, id1 AS node, id2 AS edge, cost FROM
        pgr_dijkstra('
          SELECT id, source::integer, target::integer, cost::double precision FROM
            ahb_2po_4pgr', ${n1.id}, ${n2.id}, false, false
          );`;
      console.log(stmt);
      client.query(stmt, function(err, result) {
        console.log(err);
        console.log(result.rows);

        console.log(new Date().getTime()-t);
        pg.end();
      });
    });
  });
}

/**
Possibly use this instead
SELECT name, gid
FROM ahb_2po_4pgr
ORDER BY road <-> st_setsrid(st_makepoint(-90,40),4326)
LIMIT 10;
**/

function getNode(point, callback) {
  var parts = point.split(',');
  /*var stmt = `SELECT id, source, target, cost::double precision, geojson,
                ST_Distance(
                  n.road,ST_SetSRID(
                    ST_MakePoint(${parts[1]},${parts[0]}),4326)
                ) as distance
              FROM ahb_2po_4pgr n ORDER BY distance ASC LIMIT 1;`;*/

  var stmt = `SELECT id
              FROM ahb_2po_4pgr_vertices_pgr
              ORDER BY the_geom <-> st_setsrid(st_makepoint(${parts[1]}, ${parts[0]}),4326)
              LIMIT 1;`

  console.log(stmt);
  client.query(stmt, function(err, result) {
    console.log(err);
    console.log(result);
    callback(result.rows[0]);
  });
}
