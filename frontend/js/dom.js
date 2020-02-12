const addListItem = station => {
  const pctFull = Math.round((station.count / station.capacity) * 100);
  const exclaim = pctFull >= 100 ? '!!' : '';
  const text = `Station at ${pctFull}% capacity${exclaim} (${station.count}/${station.capacity})`;
  const newElement = 
  `<button type="button" class="collapsible">Station ${station.id}</button>
  <div class="content"> 
    <p>${text}</p> 
  </div>`;
  const stationList = $('#station-list');
  stationList.append(newElement);
};

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}
