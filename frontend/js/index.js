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
const apiurl = 'http://127.0.0.1:5000';

const makeMarkerIcon = (num, color) =>
  `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=${num}|${color}|000000`;

const getRandomColor = () =>
  '#' + Math.floor(Math.random() * 16777215).toString(16);

const getRandomColorArray = n => Array.from({ length: n }, getRandomColor);

const colorArray = getRandomColorArray(15);

const getNearbyBikes = (lat, lng) =>
  $.get(`${apiurl}/bikes?lat=${lat}&lng=${lng}`);

const getStations = () => $.get(`${apiurl}/stations`);

const post = (url, data) =>
  $.ajax({
    url,
    type: 'POST',
    data,
    contentType: 'application/json',
  });

const updateStation = station => post(`${apiurl}/station`, station);

const tagBikes = (stations, bikes) =>
  post(`${apiurl}/bike_tags`, JSON.stringify({ stations, bikes }));

const stationCounts = (stations, bikes) =>
  post(`${apiurl}/station_counts`, JSON.stringify({ stations, bikes }));

const makeStationCircle = station =>
  new google.maps.Circle({
    editable: true,
    strokeColor: colorArray[station.id],
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: colorArray[station.id],
    fillOpacity: 0.35,
    map: map,
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
    const color =
      stationNum == -1 ? 'ffffff' : colorArray[stationNum].substr(1);
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

const showStationMarkers = stations =>
  // show circles around each station
  stations.forEach(station => {
    const circle = makeStationCircle(station);
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
  const bikes = await getNearbyBikes(
    collegeStation.lat,
    collegeStation.lng
  ).then(response => response.data);
  // Get tagged bikes
  const bikeTags = await tagBikes(stations, bikes).then(
    response => response.data
  );
  showBikeMarkers(bikes, bikeTags);
}
