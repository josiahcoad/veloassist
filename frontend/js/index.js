// Initialize map
var map;
const collegeStation = { lat: 30.617592, lng: -96.338644 };

// Sort array of json objects by key
const sortByKey = (array, key) =>
  array.sort(function(a, b) {
    var x = a[key];
    var y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });

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

async function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: {
      lat: collegeStation.lat,
      lng: collegeStation.lng,
    },
  });
  writeMap();
}
