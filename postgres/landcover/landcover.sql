-- This file sets of the cdl.landcover function which uses CDL data to
-- predict the most likely crop for a particular region.
--
create or replace function test_land_cover() 
returns jsonb language sql as $$
select '{"geometries":[
{"coordinates":
 [[[-122.9554,46.6414],[-122.9554,46.6378],
   [-122.9607,46.6377],[-122.9607,46.6413],[-122.9554,46.6414]]],
 "type":"Polygon"
},
{"coordinates":
 [[[-122.9496,46.6396],[-122.9483,46.6386],[-122.9483,46.6368],
  [-122.9474,46.6363],[-122.9496,46.6342],[-122.9496,46.6396]]],
 "type":"Polygon"
},
{"coordinates":
 [[[-122.9607,46.6424],[-122.9577,46.6424],[-122.9542,46.6419],
   [-122.9533,46.6425],[-122.9496,46.6396],[-122.9496,46.6383],
   [-122.9554,46.6382],[-122.9554,46.6414],[-122.9607,46.6413],
   [-122.9607,46.6424]]],
"type":"Polygon"},
{"coordinates":
 [[[-122.9554,46.6382],[-122.9496,46.6383],[-122.9496,46.6342],
   [-122.9607,46.6342],[-122.9607,46.6377],[-122.9554,46.6378],
   [-122.9554,46.6382]]],
"type":"Polygon"}],
"type":"GeometryCollection"}'::jsonb;
$$;

create or replace function lc_polys(g_in jsonb)
returns table (index integer,id text,geom jsonb,boundary geometry) 
language sql as $$
with a as (
select l as index,
 ($1)->'geometries'->l as geom,
 st_transform( st_setsrid(
  st_geomfromgeojson($1->'geometries'->>l),4269),97260) as boundary
from generate_series(0,jsonb_array_length(($1)->'geometries')-1) as l
)
select index,md5(geom::text) as id,geom,boundary 
from a;
$$;

-- This is significantly slower then the clip version
-- create or replace function lc_type(g_in json) 
-- returns table (id text,cdl integer,confidence numeric(6,2))
-- language sql as $$
-- with p as (
--  select l.id,pid,
--  ((st_intersection(r.rast,l.boundary)).val)::integer 
--  from 
--  lc_polys($1) as l,
--  afri.pixels_8km p join cdl.pixels r using (pid) 
--  where st_intersects(l.boundary,p.boundary)
-- ), 
-- m as (
--  select id,val,count(*) 
--  from p group by 1,2 order by 1,2
-- ),
-- n as ( 
--  select id,val,count,
--  max(count) OVER W as max,
--  sum(count) OVER W 
--  from m 
--  WINDOW W as (partition by id)
-- )
-- select id,val as cdl,(count/sum)::decimal(6,2) as confidence
-- from n 
-- where count=max;
-- $$;

create or replace function lc_type(g_in jsonb)
returns table (index integer,id text,cdl integer,
count bigint,total bigint,confidence numeric(6,2))
language sql as $$
with 
l as ( select * from lc_polys($1)),
p as (
 select l.index,l.id,pid,
 unnest(st_dumpvalues(st_clip(r.rast,l.boundary),1,true)) as val
 from l,
 afri.pixels_8km p join cdl.pixels r using (pid)
 where st_intersects(l.boundary,p.boundary)
), 
m as (
 select index,val::integer,count(*) 
 from p
 where val is not null
 group by 1,2
),
n as ( 
 select index,val,count,
 max(count) OVER W as max,
 sum(count) OVER W 
 from m 
 WINDOW W as (partition by index)
)
select index,id,val as cdl,count,sum::bigint,
 (count/sum)::decimal(6,2) as confidence
from n join l using (index)
where count=max;
$$;

create or replace function land_cover(g_in jsonb)
returns json
language sql as $$
select array_to_json(array_agg(
 json_build_object('id',id,'cdl',cdl,'confidence',confidence::float)),true)
from lc_type($1)
$$;



