# /bin/bash

TOOLDIR=osm2po
RELEASE=5.1.0
JAR=osm2po-core-$RELEASE-signed.jar
DEST=ahb
DATAROOT="http://download.geofabrik.de/north-america/us/"
FILES=("california" "oregon" "washington" "idaho")
EXEC="java -Xmx1g -jar $TOOLDIR/$JAR"

# grab tool
if [ ! -d "$TOOLDIR" ]; then
  wget http://osm2po.de/releases/osm2po-$RELEASE.zip
  unzip osm2po-$RELEASE.zip -d $TOOLDIR
  rm osm2po-$RELEASE.zip
fi

# prepare each state
ALL=""
for i in "${FILES[@]}"
do
  $EXEC cmd=c workDir=data/$i prefix=$i tileSize=x,c $DATAROOT$i-latest.osm.pbf
  ALL=$ALL" data/"$i
done

# merge each state into $DEST.  fires up test server when completed
$EXEC workDir=data/$DEST cmd=m tileSize=x,c prefix=$DEST $ALL
$EXEC workDir=data/$DEST cmd=sg tileSize=x,c prefix=$DEST
$EXEC workDir=data/$DEST cmd=r tileSize=x,c prefix=$DEST
