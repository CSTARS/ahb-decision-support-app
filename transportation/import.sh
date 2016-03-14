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

  echo "*******************************************"
  echo "You now need to edit ./$TOOLDIR/osm2po.conf"
  echo "Uncomment: "
  echo "  'postp.0.class = de.cm.osm2po.plugins.postp.PgRoutingWriter'"
  echo "  'postp.0.writeMultiLineStrings = true'"
  echo ""
  echo "Then re-run script"
  exit 1;
fi

# prepare each state
ALL=""
for i in "${FILES[@]}"
do
  $EXEC cmd=tj workDir=data/$i prefix=$i tileSize=x,c $DATAROOT$i-latest.osm.pbf
  ALL=$ALL" data/"$i
done

# merge each state into $DEST.  fires up test server when completed
$EXEC workDir=data/$DEST cmd=mspg tileSize=x,c prefix=$DEST $ALL
$EXEC workDir=data/$DEST cmd=r tileSize=x,c prefix=$DEST
