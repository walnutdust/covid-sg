#!/bin/sh

# The API only allows for 2000 data at a time, so we make the necessary calls and pretend it's a JSON.
echo '[' > src/data/data.json
curl 'https://services6.arcgis.com/LZwBmoXba0zrRap7/arcgis/rest/services/COVID_19_Prod_B_feature/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Case_ID%20desc&resultOffset=0&cacheHint=true' -H 'Accept-Language: en-US,en;q=0.5' --compressed -H 'Origin: https://moh-sla-ncov.maps.arcgis.com' -H 'Connection: keep-alive' -H 'Referer: https://moh-sla-ncov.maps.arcgis.com/apps/opsdashboard/index.html'  >> src/data/data.json
echo ',' >> src/data/data.json
curl 'https://services6.arcgis.com/LZwBmoXba0zrRap7/arcgis/rest/services/COVID_19_Prod_B_feature/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Case_ID%20desc&resultOffset=2000&cacheHint=true' -H 'Accept-Language: en-US,en;q=0.5' --compressed -H 'Origin: https://moh-sla-ncov.maps.arcgis.com' -H 'Connection: keep-alive' -H 'Referer: https://moh-sla-ncov.maps.arcgis.com/apps/opsdashboard/index.html'  >> src/data/data.json
echo ']' >> src/data/data.json
node ./src/data/process.js