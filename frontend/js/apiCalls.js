const apiurl = 'http://127.0.0.1:5000';

const post = (url, data) =>
  $.ajax({
    url,
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json',
  }).then(response => response.data);

const getNearbyBikes = (lat, lng) =>
  $.get(`${apiurl}/bikes?lat=${lat}&lng=${lng}`).then(
    response => response.data
  );

const getStationsAndBikes = () =>
  $.get(`${apiurl}/bikes_stations`).then(response => response.data);

const getStations = () =>
  $.get(`${apiurl}/stations`).then(response => response.data);

const updateStation = station => post(`${apiurl}/station`, station);

const tagBikes = (stations, bikes) =>
  post(`${apiurl}/bike_tags`, { stations, bikes });

const messageSlack = text => post(`${apiurl}/slack_message`, { text });
