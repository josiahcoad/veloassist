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

const processBikeResponse = data => {
  console.log(data);
  return data;
};

const make_circle = center =>
  new google.maps.Circle({
    editable: true,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    map: map,
    center: { lat: center[0], lng: center[1] },
    radius: 30,
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

const iconBase =
  'https://developers.google.com/maps/documentation/javascript/examples/full/images/';


async function initMap() {
  let stations;
  try {
    const response = await getStations();
    stations = response.data;
  } catch (e) {
    console.log(e);
  }

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: {
      lat: collegeStation.lat,
      lng: collegeStation.lng,
    },
  });

  // show circles around each station
  stations.forEach(center => {
    const circle = make_circle(center);
    google.maps.event.addListener(circle, 'radius_changed', function(center) {
      console.log(center);
      console.log(circle.getRadius());
    });
  });

  // Show bikes on map
  getNearbyBikes(collegeStation.lat, collegeStation.lng)
    .then(showBikeMarkers)
    .catch(alert);
}
