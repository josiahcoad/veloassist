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

const sendMessageSlack = stations => {
  const full = stations.filter(s => s.fill >= 100)[0];
  const text = `Station ${full.id} at (${full.lat}, ${full.lng}) is at ${full.fill}% capacity! (${full.occupancy}/${full.capacity})`;
  messageSlack(text);
};

async function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: {
      lat: collegeStation.lat,
      lng: collegeStation.lng,
    },
  });
  await writeMap();
  $(".loader").hide();
  $(".cbcontainer").show();
}
