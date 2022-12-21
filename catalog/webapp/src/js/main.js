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


let timestamps;
let timestamp_index = 0;

function update_range() {
  let timestamp = timestamps[timestamp_index];
  document.getElementById("timestampLabel").innerText = timestamp;
  document.getElementById("timestampRange").value = 100*timestamp_index/timestamps.length;
}

function next_timestamp() {
  if (!timestamps) return;
  timestamp_index++;
  timestamp_index %= timestamps.length;
  let timestamp = timestamps[timestamp_index];
  layers[1].getSource().updateParams({'TIME': timestamp});
  update_range();
}

let interval;
function animation_play() {
  interval = setInterval(next_timestamp, 2000);
}
function animation_pause() {
  if (interval) {
    clearInterval(interval);
  }
}

let url="/geoserver/marcis/wms?service=WMS&version=1.1.0&request=GetCapabilities";
fetch(url)
  .then(response => response.text())
  .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
  .then(doc => doc.querySelector('Extent'))
  .then(node => timestamps = node.textContent.split(','))
  .then(update_range)
  .then(animation_play);

document.getElementById("play").addEventListener("click", animation_play);
document.getElementById("pause").addEventListener("click", animation_pause);
