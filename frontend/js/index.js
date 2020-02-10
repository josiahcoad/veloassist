// Initialize and add the map
var showTrafficLayer = false;
var showBikingLayer = false;
var showDirectionPanel = true;
var closestStation = false;
var displayRoute;
var bikeRoute;
var carRoute;
var walkLeg;
var bikeLeg;
var currentRoute;
var currentPosition;
var map;
const collegeStation = { lat: 30.617592, lng: -96.338644 };

const getNearbyBikes = (lat, lng) =>
  new Promise((resolve, reject) => {
    $.ajaxSetup({
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxOjU1MzQiLCJpYXQiOjE1Nzk5OTUzMTgsImV4cCI6MTU4Nzc3MTMxOH0.NNuurt6awK2ub3Athx0AqlIVNzTiWhZo_Xdi6zlrGXqDSJ17H2UIHpR8jtCiWC_XXgkQSWvpEsqgcesaSVlSnQ',
      },
    });

    $.get(
      `https://manhattan-host.veoride.com:8444/api/customers/vehicles?lat=${lat}&lng=${lng}`,
      resp => {
        resp.code == 0 ? resolve(resp.data) : reject(resp.error);
      },
      'json'
    );
  });

const getStations = () => $.get(`http://127.0.0.1:5000/stations`);

const updateStation = station =>
  $.ajax({
    url: `http://127.0.0.1:5000/station`,
    type: 'POST',
    data: JSON.stringify(station),
    contentType: 'application/json',
  });

const tagBikes = (stations, bikes) =>
  $.ajax({
    url: `http://127.0.0.1:5000/bike_tags`,
    type: 'POST',
    data: JSON.stringify({ stations, bikes }),
    contentType: 'application/json',
  });

const stationCounts = (stations, bikes) =>
  $.ajax({
    url: `http://127.0.0.1:5000/station_counts`,
    type: 'POST',
    data: JSON.stringify({ stations, bikes }),
    contentType: 'application/json',
  });

const make_circle = station =>
  new google.maps.Circle({
    editable: true,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    map: map,
    center: { lat: station.lat, lng: station.lng },
    radius: station.radius,
  });

// Show bikes on map
const showBikeMarkers = data => {
  const bikeMarkers = [];
  for (var i = 1; i < data.length; i++) {
    const bike_data = data[i];
    const lock_open = bike_data.lockStatus;
    if (lock_open) {
      const lat = bike_data.location.lat;
      const lng = bike_data.location.lng;
      const bikeMarker = new google.maps.Marker({
        position: {
          lat,
          lng,
        },
        map: map,
        icon: { url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' },
      });
      bikeMarkers.push(bikeMarker);
    }
  }
  new MarkerClusterer(map, bikeMarkers, {
    imagePath:
      'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
    gridSize: 30,
    minimumClusterSize: 10,
  });
};

const showStationMarkers = stations =>
  // show circles around each station
  stations.forEach(station => {
    const circle = make_circle(station);
    google.maps.event.addListener(circle, 'radius_changed', () => {
      updateStation({ ...station, radius: circle.getRadius() });
    });
  });

async function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: {
      lat: collegeStation.lat,
      lng: collegeStation.lng,
    },
  });

  // show stations on map
  const stations = await getStations().then(response => response.data);
  showStationMarkers(stations);

  // Show bikes on map
  const bikes = await getNearbyBikes(collegeStation.lat, collegeStation.lng);
  showBikeMarkers(bikes);

  // Get tagged bikes
  const data = await stationCounts(stations, bikes).then(
    response => response.data
  );
}
