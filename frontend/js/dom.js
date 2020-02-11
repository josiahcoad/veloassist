const addListItem = station => {
  const pctFull = Math.round((station.count / station.capacity) * 100);
  const exclaim = pctFull >= 100 ? '!!' : '';
  const text = `Station at ${pctFull}% capacity${exclaim} (${station.count}/${station.capacity})`;
  const stationList = document.getElementById('station-list');
  const newItem = document.createElement('li');
  newItem.className = 'station-list-item';
  newItem.innerText = text;
  stationList.appendChild(newItem);
};
