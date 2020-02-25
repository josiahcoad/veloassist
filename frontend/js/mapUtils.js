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

const deleteStation = (stationMarker, station) => {
  stationMarker.setMap(null);
  callDeleteStation(station.id);
  addRefreshButton();
};

const showStationMarkers = stations =>
  // show circles around each station
  stations.map(station => {
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
    google.maps.event.addListener(circle, 'click', () => {
      const checked = $('#delete-mode input[type="checkbox"]').is(':checked');
      if (checked) {
        deleteStation(circle, station);
      }
    });
    addMarkerInfo(
      circle,
      circle.center,
      `Station at ${Math.round(station.fill * 100)}% capacity 
      (${station.occupancy}/${station.capacity})`
    );
    return circle;
  });

const addMarkerInfo = (marker, position, content) => {
  var infoWindow = new google.maps.InfoWindow({
    content,
    position,
  });
  google.maps.event.addListener(marker, 'mouseover', function(ev) {
    infoWindow.open(map);
  });
  google.maps.event.addListener(marker, 'mouseout', function(ev) {
    infoWindow.close();
  });
};

const makeBikeMarker = bike => {
  const lat = bike.location.lat;
  const lng = bike.location.lng;
  const color = bike.station ? '6cf5a7' : 'ffffff';
  const label = bike.vehicleType == 0 ? '' : 'E';
  const marker = new google.maps.Marker({
    position: { lat, lng },
    label,
    map,
    icon: {
      url: makeMarkerIcon(color),
    },
  });
  const info = `
  id: ${bike.id}<br/>
  Type: ${bike.vehicleType == 0 ? 'pedal' : 'ebike'}<br/>
  lock: ${bike.lockStatus == 1 ? 'locked' : 'unlocked'}`;
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

const writeMap = async () => {
  const { bikes, stations } = await getStationsAndBikes();
  showBikeMarkers(bikes);
  const stationMarkers = showStationMarkers(stations, false);
  sortByKey(stations, 'fill')
    .reverse()
    .forEach(addListItem);
  // addAccordianEffect();
  addTotalBikeCounts(bikes);
  addEditOption(stationMarkers);
};
