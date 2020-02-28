const apiurl = 'https://e6evmmci31.execute-api.us-east-1.amazonaws.com/api';

const deleteStation = (id) =>
  $.ajax({
    url: `${apiurl}/station/${id}`,
    type: 'DELETE',
  }).then(response => response.success);

const post = (url, data) =>
  $.ajax({
    url,
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json',
  }).then(response => response.success);

const getNearbyBikes = (lat, lng) =>
  $.get(`${apiurl}/bikes?lat=${lat}&lng=${lng}`).then(
    response => response.data
  );

const getStationsAndBikes = () =>
  $.get(`${apiurl}/bikes_stations`).then(response => response.data);

const updateStation = station => post(`${apiurl}/station/1`, station);

const messageSlack = text => post(`${apiurl}/slack_message`, { text });
