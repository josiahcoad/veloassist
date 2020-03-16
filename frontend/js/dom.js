var refreshButtonShowing = false;

const addRefreshButton = () => {
  if (!refreshButtonShowing) {
    $('.sidenav').prepend(
      `<div class="center-block center">
        <p style="font-size: 12px">Changes you have made will not be reflected in
        the side panel or bike coloring until you refresh</p>
        <button class="button" id="refresh-button" onclick="location.reload()">
          Refresh!
        </button>
      </div>`
    );
  }
  refreshButtonShowing = true;
};

const makeStationEditForm = station => `
  <div class="hover_bkgr_fricc station-${station.id}">
    <span class="helper"></span>
    <div>
      <div class="popupCloseButton">&times;</div>
      <form onsubmit="return onStationEditFormSubmit(${station.id})">
        <label for="fname">Name:</label>
        <br />
        <input type="text" id="station-name-input" value="${station.name ||
          station.id}"/>
        <br />
        <label for="lname">Capacity:</label>
        <br />
        <input type="text" id="station-capacity-input" value="${
          station.capacity
        }"/>
        <br />
        <label for="lname">Min:</label>
        <br />
        <input type="text" id="station-min-input" value="${station.min || 0}"/>
        <br />
        <br />
        <input type="submit" value="Submit" />
      </form>
    </div>
  </div>`;

const addListItem = station => {
  const pctFull = Math.round(station.fill * 100);
  const newElement = `
    <div class="accordion-wrap station-${station.id}">
      <button class="accordion" onclick="centerMap(${station.lat}, ${
    station.lng
  })">
        <span class="right">${pctFull}% (${station.occupancy}/${
    station.capacity
  })</span>
        <span class="left">
          ${station.name || 'Station ' + station.id}
          <i class="fa fa-gear trigger_popup_fricc station-${station.id}"></i>
        </span>
      </button>
      <div class="panel">
        <p class="center">Id: ${station.id} </p>
        </br>
        <p class="center">Type: ${station.Type} </p>
      </div>
      <hr class="nospace" />
    </div>`;
  $('#station-list').append(newElement);
  $('#station-list').append(makeStationEditForm(station));
};

const addAccordianEffect = () => {
  $('.accordion-wrap').click(function() {
    $('.panel').slideUp();
    $(this)
      .find('.panel')
      .first()
      .slideToggle();
  });
};

const addTotalBikeCounts = bikes => {
  const instation =
    'Bikes out of stations: ' + bikes.filter(b => !b.station).length;
  const outstation =
    'Bikes in stations: ' + bikes.filter(b => b.station).length;
  $('#total-bike-counts').append(`
    <p>${instation}</p>
    <p>${outstation}</p>`);
};

const addEditOption = stationMarkers =>
  $('#edit-mode input[type="checkbox"]').click(function() {
    const checked = $(this).is(':checked');
    if (checked) {
      stationMarkers.map(m => m.setEditable(true));
    } else {
      stationMarkers.map(m => m.setEditable(false));
    }
  });

const addStationEditPopup = stations => {
  $('.trigger_popup_fricc').click(function() {
    const stationid = $(this)
      .attr('class')
      .split(' ')
      .filter(c => c.startsWith('station'))[0];
    $('.hover_bkgr_fricc.' + stationid).show();
  });
  $('.popupCloseButton').click(function() {
    $('.hover_bkgr_fricc').hide();
  });
};

// callback for HTML form input
function onStationEditFormSubmit(id) {
  const station = stations.filter(s => s.id == id)[0];
  const name = $(`.station-${id} #station-name-input`).val() || station.name;
  let capacity = $(`.station-${id} #station-capacity-input`).val();
  capacity = capacity ? parseInt(capacity) : station.capacity;
  let min = $(`.station-${id} #station-min-input`).val();
  min = min ? parseInt(min) : 0;
  updateStation({ ...station, name, min, capacity });
  $('.hover_bkgr_fricc').hide();
  return false;
}

function onStationSortSelect() {
  const options = ['fill', 'name', 'occupancy'];
  const idx = document.getElementById('station-sort').selectedIndex;
  $('#station-list').empty();
  sortByKey(stations, options[idx])
    .reverse()
    .forEach(addListItem);
}
