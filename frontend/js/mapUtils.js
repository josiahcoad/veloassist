const makeMarkerIcon = (num, color) =>
  `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=${num}|${color}|000000`;

const colorArray = [
  '05668D',
  '427AA1',
  '679436',
  'A5BE00',
  '4E598C',
  'FCAF58',
  'FF8C42',
  'FFAE03',
  'E67F0D',
  'FE4E00',
  'E9190F',
  'FF0F80',
  '008BF8',
  '04E762',
  'DC0073',
];

const showStationMarkers = stations =>
  // show circles around each station
  stations.forEach(station => {
    const circle = makeStationCircle(station);
    google.maps.event.addListener(circle, 'radius_changed', () => {
      const radius = circle.getRadius();
      updateStation({ ...station, radius });
    });
    google.maps.event.addListener(circle, 'center_changed', () => {
      const lat = circle.getCenter().lat();
      const lng = circle.getCenter().lng();
      updateStation({ ...station, lat, lng });
    });
    const pctFull = Math.round((station.occupancy / station.capacity) * 100);
    const exclaim = pctFull >= 100 ? '!!' : '';
    addCircleInfo(
      circle,
      `Station at ${pctFull}% capacity${exclaim} (${station.occupancy}/${station.capacity})`
    );
  });

const addCircleInfo = (circle, content) => {
  var infoWindow = new google.maps.InfoWindow({
    content,
    position: circle['center'],
  });
  google.maps.event.addListener(circle, 'mouseover', function(ev) {
    infoWindow.open(map);
  });
  google.maps.event.addListener(circle, 'mouseout', function(ev) {
    infoWindow.close();
  });
};

const makeStationCircle = station =>
  new google.maps.Circle({
    editable: true,
    strokeColor: '#' + colorArray[station.id],
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#' + colorArray[station.id],
    fillOpacity: 0.35,
    map,
    center: { lat: station.lat, lng: station.lng },
    radius: station.radius,
  });

const makeBikeMarker = bike => {
  const lat = bike.location.lat;
  const lng = bike.location.lng;
  const stationNum = bike.station + 1;
  const color = stationNum == 0 ? 'ffffff' : colorArray[stationNum];
  return new google.maps.Marker({
    position: { lat, lng },
    map,
    icon: {
      url: makeMarkerIcon(stationNum + 1, color),
    },
  });
};

const lockClosed = bike => bike.lockStatus;

// Show bikes on map
const showBikeMarkers = bikes => {
  const bikeMarkers = bikes.filter(lockClosed).map(makeBikeMarker);
  new MarkerClusterer(map, bikeMarkers, {
    imagePath:
      'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
    gridSize: 30,
    minimumClusterSize: 10,
  });
};

const addListItem = station => {
  const pctFull = Math.round((station.occupancy / station.capacity) * 100);
  const newElement = `<button class="accordion">
    <span class="right">${pctFull}%</span>
    <span class="left">Station ${station.id}</span>
  </button>
  <div class="panel">
    <p class="center">Current: ${station.occupancy}
      <span class="left">Min: 5</span>
      <span class="right">Max: ${station.capacity}</span></p>
  </div>`;
  const stationList = $('.station-list');
  stationList.append(newElement);
};

const writeMap = async () => {
  const { bikes, stations } = await getStationsAndBikes();
  showBikeMarkers(bikes);
  showStationMarkers(stations);
  stations.forEach(addListItem);
};
