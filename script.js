const input = document.getElementById("pnrInput");
const button = document.getElementById("checkBtn");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("result");

button.addEventListener("click", checkPNR);

input.addEventListener("keydown", function(e){
  if(e.key === "Enter"){
    checkPNR();
  }
});

input.addEventListener("input", function(){
  this.value = this.value.replace(/\D/g, "").slice(0, 10);
  hideError();
});

async function checkPNR(){

  const pnr = input.value.trim();

  hideError();
  resultBox.classList.add("hidden");

  if(!/^\d{10}$/.test(pnr)){
    showError("Please enter a valid 10-digit PNR number.");
    return;
  }

  button.disabled = true;
  button.innerHTML = "⏳ Checking...";
  loading.classList.remove("hidden");

  try{

    const response = await fetch(
      "/api/pnr?pnr=" + encodeURIComponent(pnr),
      {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      }
    );

    const text = await response.text();

    let data;

    try{
      data = JSON.parse(text);
    }catch(e){
      console.log("Server response:", text);
      throw new Error("Server returned an invalid response.");
    }

    console.log("AINEX PNR Response:", data);

    if(!response.ok || data.success === false){
      throw new Error(
        data.message ||
        data.error ||
        "PNR status could not be fetched."
      );
    }

    displayResult(data, pnr);

  }catch(error){

    console.error("AINEX PNR ERROR:", error);

    showError(
      error.message ||
      "PNR check failed. Please try again."
    );

  }finally{

    button.disabled = false;
    button.innerHTML = "🔍 Check Status";
    loading.classList.add("hidden");

  }
}


/* RESULT */

function displayResult(apiResponse, pnr){

  const data =
    apiResponse.data ||
    apiResponse.result ||
    apiResponse;

  const train =
    data.train ||
    data.trainDetails ||
    {};

  const journey =
    data.journey ||
    data.journeyDetails ||
    {};

  const passengers =
    Array.isArray(data.passengers)
      ? data.passengers
      : [];


  const trainNumber =
    train.number ||
    train.trainNumber ||
    data.trainNumber ||
    "-";

  const trainName =
    train.name ||
    train.trainName ||
    data.trainName ||
    "-";

  const from =
    journey.from ||
    journey.source ||
    data.from ||
    data.source ||
    "-";

  const to =
    journey.to ||
    journey.destination ||
    data.to ||
    data.destination ||
    "-";

  const date =
    journey.date ||
    data.journeyDate ||
    data.date ||
    "-";

  const travelClass =
    journey.class ||
    data.class ||
    data.travelClass ||
    "-";

  const quota =
    journey.quota ||
    data.quota ||
    "-";

  const fare =
    journey.fare ||
    data.fare ||
    "-";


  setValue("showPnr", pnr);
  setValue("fromStation", from);
  setValue("toStation", to);
  setValue(
    "trainInfo",
    trainNumber + (
      trainName !== "-" ? " • " + trainName : ""
    )
  );

  setValue("journeyDate", date);
  setValue("travelClass", travelClass);
  setValue("quota", quota);
  setValue("fare", fare);


  const status =
    getOverallStatus(data, passengers);

  const statusElement =
    document.getElementById("overallStatus");

  statusElement.textContent = status;

  statusElement.className =
    "status-badge " + statusClass(status);


  renderPassengers(passengers);

  resultBox.classList.remove("hidden");

  setTimeout(function(){
    resultBox.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  },100);
}


/* PASSENGERS */

function renderPassengers(passengers){

  const list =
    document.getElementById("passengerList");

  const count =
    document.getElementById("passengerCount");

  list.innerHTML = "";

  count.textContent =
    passengers.length +
    " Passenger" +
    (passengers.length === 1 ? "" : "s");


  if(!passengers.length){

    list.innerHTML = `
      <div class="passenger">
        <div>
          <strong>Passenger details unavailable</strong>
          <span>
            Railway response did not provide passenger information.
          </span>
        </div>
      </div>
    `;

    return;
  }


  passengers.forEach(function(p,index){

    const name =
      p.name ||
      p.passengerName ||
      p.details?.name ||
      "Passenger " + (index + 1);


    const booking =
      p.booking?.details ||
      p.booking?.status ||
      p.bookingStatus ||
      "-";


    const current =
      p.current?.details ||
      p.current?.status ||
      p.currentStatus ||
      "-";


    const coach =
      p.current?.coach ||
      p.coach ||
      "";


    const berth =
      p.current?.berth ||
      p.berth ||
      "";


    const item =
      document.createElement("div");

    item.className = "passenger";

    item.innerHTML = `
      <div>

        <strong>${safe(name)}</strong>

        <span>
          Booking: ${safe(booking)}
        </span>

        <span>
          Current: ${safe(current)}
        </span>

        ${
          coach
          ? `<span>Coach: ${safe(coach)}</span>`
          : ""
        }

        ${
          berth
          ? `<span>Berth: ${safe(berth)}</span>`
          : ""
        }

      </div>

      <div class="passenger-status ${statusClass(current)}">
        ${safe(current)}
      </div>
    `;

    list.appendChild(item);

  });
}


/* OVERALL STATUS */

function getOverallStatus(data, passengers){

  if(data.status){
    return data.status;
  }

  const statuses =
    passengers.map(function(p){

      return String(
        p.current?.status ||
        p.currentStatus ||
        ""
      ).toUpperCase();

    });


  if(
    statuses.some(s =>
      s.includes("CNF") ||
      s.includes("CONFIRM")
    )
  ){
    return "✓ CNF";
  }


  if(
    statuses.some(s =>
      s.includes("RAC")
    )
  ){
    return "● RAC";
  }


  if(
    statuses.some(s =>
      s.includes("WL") ||
      s.includes("WAIT")
    )
  ){
    return "● WL";
  }


  return "Available";
}


/* STATUS CLASS */

function statusClass(status){

  const value =
    String(status || "").toUpperCase();

  if(
    value.includes("CNF") ||
    value.includes("CONFIRM")
  ){
    return "confirmed";
  }

  if(value.includes("RAC")){
    return "rac";
  }

  if(
    value.includes("WL") ||
    value.includes("WAIT")
  ){
    return "waiting";
  }

  return "";
}


/* SET VALUE */

function setValue(id,value){

  const element =
    document.getElementById(id);

  if(element){
    element.textContent =
      value ?? "-";
  }
}


/* ERROR */

function showError(message){

  errorBox.textContent =
    "⚠️ " + message;

  errorBox.classList.remove("hidden");
}

function hideError(){

  errorBox.classList.add("hidden");
}


/* SECURITY */

function safe(value){

  return String(value ?? "-")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
