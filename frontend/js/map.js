var stations;

const makeMarkerIcon = color =>
  `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|${color}|000000`;

const makeStationCircle = station =>
  new google.maps.Circle({
    editable: false,
    strokeColor: '#' + station.color,
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#' + station.color,
    fillOpacity: 0.35,
    map,
    center: { lat: station.lat, lng: station.lng },
    radius: station.radius,
    suppressUndo: true,
  });

const removeStation = (stationMarker, station) => {
  stationMarker.setMap(null);
  deleteStation(station.id);
  addRefreshButton();
};

const showStationMarker = station => {
  const circle = makeStationCircle(station);
  google.maps.event.addListener(circle, 'radius_changed', () => {
    const radius = circle.getRadius();
    updateStation({ ...station, radius });
    addRefreshButton();
  });
  google.maps.event.addListener(circle, 'center_changed', () => {
    const lat = circle.getCenter().lat();
    const lng = circle.getCenter().lng();
    updateStation({ ...station, lat, lng });
    addRefreshButton();
  });
  google.maps.event.addListener(circle, 'dblclick', () => {
    const checked = $('#delete-mode input[type="checkbox"]').is(':checked');
    if (checked) {
      removeStation(circle, station);
    }
  });
  addMarkerInfo(
    circle,
    circle.center,
    `Station ${station.name || station.id}<br/>
    at ${Math.round(station.fill * 100)}% capacity 
    (${station.occupancy}/${station.capacity})`
  );
  return circle;
};

const showStationMarkers = stations => stations.map(showStationMarker);

const randomColor = () => Math.floor(Math.random() * 16777215).toString(16);

const createStationMarker = (id, lat, lng) => {
  const color = randomColor();
  const station = { id, lat, lng, color, radius: 10, capacity: 10 };
  // update db
  updateStation(station);
  // showStationMarker (won't have edit capability and will show NaN% fill)
  showStationMarker(station);
  addRefreshButton();
};

const addMarkerInfo = (marker, position, content) => {
  var infoWindow = new google.maps.InfoWindow({
    content,
    position,
  });
  google.maps.event.addListener(marker, 'click', function(ev) {
    infoWindow.open(map);
  });
  google.maps.event.addListener(map, 'click', function(ev) {
    infoWindow.close();
  });
};

const getBikeMarkerColor = bike => {
  const colors = {
    dark: {
      blue: '1683c7',
      red: 'de2121',
      yellow: 'fbff0f',
    },
    light: {
      blue: 'e0f3ff',
      red: 'f09090',
      yellow: 'feffad',
    },
  };
  const ebike = 2;
  const palette = bike.station === null ? colors.light : colors.dark;
  if (bike.vehicleType == ebike) {
    return bike.power < 30 ? palette.red : palette.yellow;
  }
  return palette.blue;
};

const makeBikeMarker = bike => {
  const lat = bike.location.lat;
  const lng = bike.location.lng;
  const color = getBikeMarkerColor(bike);
  const label = bike.vehicleType == 0 ? '' : 'E';
  const marker = new google.maps.Marker({
    position: { lat, lng },
    // label,
    map,
    icon: {
      url: makeMarkerIcon(color),
    },
  });
  const info = `
  Bike: ${bike.vehicleNumber}<br/>
  Type: ${bike.vehicleType == 0 ? 'pedal' : 'ebike'}<br/>
  Lock: ${bike.lockStatus == 1 ? 'locked' : 'unlocked'}`;
  addMarkerInfo(marker, marker.position, info);
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

function centerMap(lat, lng) {
  map.panTo({ lat, lng });
  map.setZoom(18);
}

const addCreateOption = () =>
  google.maps.event.addListener(map, 'click', function(event) {
    newStationId += 1;
    let lat = event.latLng.lat();
    let lng = event.latLng.lng();
    const checked = $('#create-mode input[type="checkbox"]').is(':checked');
    if (checked) {
      createStationMarker(newStationId, lat, lng);
    }
  });

const writeMap = async () => {
  const data = await getStationsAndBikes();
  stations = data.stations;
  const bikes = data.bikes;
  showBikeMarkers(bikes);
  const stationMarkers = showStationMarkers(stations, false);
  sortByKey(stations, 'fill')
    .reverse()
    .forEach(addListItem);
  // addAccordianEffect();
  addTotalBikeCounts(bikes);
  addEditOption(stationMarkers);
  newStationId = Math.max(...stations.map(s => s.id));
  addCreateOption();
  addStationEditPopup();
};
