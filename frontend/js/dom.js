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

const addListItem = station => {
  const pctFull = Math.round(station.fill * 100);
  const newElement = `
    <div class="accordion-wrap">
      <button class="accordion" onclick="centerMap(${station.lat}, ${station.lng})">
        <span class="right">Min: ${station.min}, Max: ${station.capacity}, Current: ${station.occupancy}</span>
        <span class="left">Station ${station.id}</span>
      </button>
      <div class="panel">
        <p class="center">Id: ${station.id} </p>
        </br>
        <p class="center">Type: ${station.Type} </p>
      </div>
      <hr class="nospace" />
    </div>`;
  $('.station-list').append(newElement);
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
