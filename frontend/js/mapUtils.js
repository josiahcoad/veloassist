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
      updateStation({ ...station, radius }).then(refreshMap);
    });
    google.maps.event.addListener(circle, 'center_changed', () => {
      const lat = circle.getCenter().lat();
      const lng = circle.getCenter().lng();
      updateStation({ ...station, lat, lng }).then(refreshMap);
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

// Show bikes on map
const showBikeMarkers = (bikes, bikeTags) => {
  const bikeMarkers = [];
  for (var i = 1; i < bikes.length; i++) {
    const bike = bikes[i];
    const lockOpen = bike.lockStatus;
    if (!lockOpen) continue;
    const lat = bike.location.lat;
    const lng = bike.location.lng;
    const stationNum = bikeTags[i];
    const color = stationNum == -1 ? 'ffffff' : colorArray[stationNum];
    bikeMarkers.push(
      new google.maps.Marker({
        position: { lat, lng },
        map,
        icon: {
          url: makeMarkerIcon(stationNum + 1, color),
        },
      })
    );
  }
  new MarkerClusterer(map, bikeMarkers, {
    imagePath:
      'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
    gridSize: 30,
    minimumClusterSize: 10,
  });
};

const writeMap = async () => {
  // show stations on map
  let stations = await getStations();
  // Show bikes on map
  const bikes = await getNearbyBikes(collegeStation.lat, collegeStation.lng);
  // Get tagged bikes
  const bikeTags = await tagBikes(stations, bikes);
  showBikeMarkers(bikes, bikeTags);
  // Get station occupancy
  const occupancies = await getStationOccupancies(bikeTags);
  stations = stations.map((station, idx) => ({
    ...station,
    occupancy: occupancies[idx],
  }));
  showStationMarkers(stations);
  stations.forEach(addListItem);
};
