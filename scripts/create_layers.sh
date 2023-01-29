#!/bin/bash

set -exuo pipefail
shopt -s globstar

url="http://localhost:8080"
credentials="admin:geoserver"
workspace="marcis"
style="$workspace:seabirds"
geoserver_path="file:///opt/marcis"

for file in **/indexer.properties
do
  path="$geoserver_path/$(dirname $file)"
  layer="$(basename $path)"
  curl -v -u "$credentials" --header "Content-Type: application/json" --data "$(
      jq --null-input --arg workspace "$workspace" --arg url "$path" --arg layer "$layer" '
          {
            "coverageStore": {
              "name": $layer,
              "url": $url,
              "type": "ImageMosaic",
              "enabled": true,
              "workspace": {
                "name": $workspace
              }
            }
          }
      ')" "$url/geoserver/rest/workspaces/$workspace/coveragestores"
  curl -v -u "$credentials" --header "Content-Type: application/json" --data "$(
      jq --null-input --arg workspace "$workspace" --arg layer "$layer" '
          {
            "coverage": {
              "name": $layer,
              "nativeName": $layer,
              "namespace": {
                "name": $workspace
              },
              "title": $layer,
              "description": "Generated from ImageMosaic",
              "keywords": {
                "string": [
                  $layer,
                  "WCS",
                  "ImageMosaic"
                ]
              },
              "enabled": true,
              "metadata": {
                "entry": [
                  {
                    "@key": "time",
                    "dimensionInfo": {
                      "enabled": true,
                      "presentation": "LIST",
                      "units": "ISO8601",
                      "defaultValue": "",
                      "nearestMatchEnabled": false,
                      "rawNearestMatchEnabled": false
                    }
                  }
                ]
              }
            }
          }
      ')" "$url/geoserver/rest/workspaces/$workspace/coveragestores/$layer/coverages"
  curl -v -u "$credentials" --header "Content-Type: application/json" --data "$(
      jq --null-input --arg workspace "$workspace" --arg layer "$layer" --arg style "$style" '
        {
          "layer": {
            "name": $layer,
            "type": "RASTER",
            "defaultStyle": {
              "name": $style,
              "workspace": $workspace
            }
          }
        }
      ')" -X PUT "$url/geoserver/rest/layers/$workspace:$layer"
done
