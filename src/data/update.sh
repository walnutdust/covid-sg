#!/bin/sh

curl 'https://services6.arcgis.com/LZwBmoXba0zrRap7/arcgis/rest/services/COVID_19_Prod_feature/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&outFields=*&orderByFields=Case_ID%20desc&resultOffset=0' --compressed -H 'Origin: https://moh-sla-ncov.maps.arcgis.com' -H 'Referer: https://moh-sla-ncov.maps.arcgis.com/apps/opsdashboard/index.html' > data.json
curl 'https://services6.arcgis.com/LZwBmoXba0zrRap7/arcgis/rest/services/COVID_19_Prod_cumulative/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&outFields=*&orderByFields=Date%20asc&resultOffset=0' --compressed -H 'Origin: https://moh-sla-ncov.maps.arcgis.com' -H 'Referer: https://moh-sla-ncov.maps.arcgis.com/apps/opsdashboard/index.html' -H 'TE: Trailers' > cumulativeData.json
node ./process.js