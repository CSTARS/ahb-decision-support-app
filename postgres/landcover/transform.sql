-- this creates a table of rasters at 30, that match the AHB pixels
-- These are used to predict crop types for the decsion support tool.
-- 
create table cdl.pixels as with
p as (
select pid,
boundary,
st_setsrid(
  st_makeemptyraster((size/32)::integer,(size/32)::integer,east-size/2,north+size/2,32),
97260) as rast
from afri.pixels_8km
),
r as (
select rid,(st_metadata(rast)).*
from cdl.km4
),
rr as (
select
rid,
st_transform(
 st_setsrid(
  st_makebox2d(
   st_makepoint(upperleftx,upperlefty),
   st_makepoint(upperleftx+width*scalex,upperlefty+height*scaley)
  ),98363),
97260) as boundary
from r)
select pid,st_union(st_clip(st_transform(a.rast,p.rast),p.boundary)) as rast
from p cross join rr join cdl.km4 a using (rid)
where st_intersects(rr.boundary,p.boundary)
group by 1;
