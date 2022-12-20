import '../scss/style.scss';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import OSM from 'ol/source/OSM';

import {getCenter} from 'ol/extent';
import {transformExtent} from 'ol/proj';
const extent = transformExtent([-51.227974148892, 50.05096665497701, 68.77940958664122, 84.83555777642], 'EPSG:4326', 'EPSG:3857');

const layers = [
  new TileLayer({
    source: new OSM()
  }),
  new TileLayer({
    source: new TileWMS({
      attributions: ['MARCIS'],
      url: '/geoserver/marcis/wms',
      params: {'LAYERS': 'marcis:marcis'},
    }),
  }),
];

const map = new Map({
  target: 'map',
  layers: layers,
  view: new View({
    center: getCenter(extent),
    zoom: 3
  })
});


let url="/geoserver/marcis/wms?service=WMS&version=1.1.0&request=GetCapabilities";
fetch(url)
  .then(response => response.text())
  .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
  .then(doc => doc.querySelector('Extent'))
  .then(node => node.textContent.split(','))
  .then(timestamps => {
    timestamps.forEach((timestamp, index) => {
      setTimeout(_=> {
        layers[1].getSource().updateParams({'TIME': timestamp});
      }, (index+1)*1000);
    });
  });
