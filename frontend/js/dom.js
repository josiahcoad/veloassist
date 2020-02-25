const addListItem = station => {
  const pctFull = Math.round(station.fill * 100);
  const newElement = `
    <div class="accordion-wrap">
      <button class="accordion" onclick="centerMap(${station.lat}, ${station.lng})">
        <span class="right">${pctFull}% (${station.occupancy}/${station.capacity})</span>
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
