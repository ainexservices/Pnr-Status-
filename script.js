const pnrInput = document.getElementById("pnr");
const checkBtn = document.getElementById("checkBtn");
const resultBox = document.getElementById("result");
const errorBox = document.getElementById("error");
const loading = document.getElementById("loading");

function esc(value){
  return String(value ?? "-")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function value(obj, keys){
  for(const key of keys){
    if(obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== ""){
      return obj[key];
    }
  }
  return "-";
}

function statusClass(status){
  const s = String(status).toUpperCase();

  if(s.includes("CNF") || s.includes("CONFIRM"))
    return "confirmed";

  if(s.includes("RAC"))
    return "rac";

  if(s.includes("WL") || s.includes("WAIT"))
    return "waiting";

  return "";
}

function flatten(data){

  if(data?.data && typeof data.data === "object"){
    return {...data,...data.data};
  }

  return data || {};
}

function getPassengers(data){

  if(Array.isArray(data?.passengers))
    return data.passengers;

  if(Array.isArray(data?.passenger))
    return data.passenger;

  if(Array.isArray(data?.booking?.passengers))
    return data.booking.passengers;

  return [];
}

function renderResult(raw,pnr){

  const data = flatten(raw);

  const train = data.train || {};
  const journey = data.journey || {};
  const booking = data.booking || {};

  const trainName =
    value(data,["trainName","train_name"]) !== "-"
      ? value(data,["trainName","train_name"])
      : value(train,["name","trainName"]);

  const trainNumber =
    value(data,["trainNumber","train_number","trainNo"]) !== "-"
      ? value(data,["trainNumber","train_number","trainNo"])
      : value(train,["number","trainNumber","trainNo"]);

  const from =
    value(data,["from","source","fromStation","boardingStation"]) !== "-"
      ? value(data,["from","source","fromStation","boardingStation"])
      : value(journey,["from","source","boardingStation"]);

  const to =
    value(data,["to","destination","toStation","destinationStation"]) !== "-"
      ? value(data,["to","destination","toStation","destinationStation"])
      : value(journey,["to","destination","destinationStation"]);

  const date =
    value(data,["journeyDate","journey_date","date","doj"]) !== "-"
      ? value(data,["journeyDate","journey_date","date","doj"])
      : value(journey,["date","journeyDate","doj"]);

  const quota =
    value(data,["quota","bookingQuota"]) !== "-"
      ? value(data,["quota","bookingQuota"])
      : value(booking,["quota","bookingQuota"]);

  const cls =
    value(data,["class","travelClass"]) !== "-"
      ? value(data,["class","travelClass"])
      : value(booking,["class","travelClass"]);

  const fare =
    value(data,["fare","totalFare","amount"]) !== "-"
      ? value(data,["fare","totalFare","amount"])
      : value(booking,["fare","totalFare","amount"]);

  const overallStatus =
    value(data,[
      "status",
      "pnrStatus",
      "currentStatus",
      "bookingStatus"
    ]);

  const passengers = getPassengers(data);

  const passengerHTML = passengers.length
    ? passengers.map((p,i)=>{

        const current = value(p,[
          "currentStatus",
          "current",
          "current_status",
          "status"
        ]);

        const booked = value(p,[
          "bookingStatus",
          "booking",
          "booking_status"
        ]);

        const name = value(p,[
          "name",
          "passengerName"
        ]);

        const coach = value(p,[
          "coach",
          "coachNumber"
        ]);

        const berth = value(p,[
          "berth",
          "berthNumber",
          "seat"
        ]);

        return `
          <div class="passenger">

            <div>
              <strong>
                Passenger ${i+1}${name !== "-" ? " — "+esc(name) : ""}
              </strong>

              <small>
                Booking: ${esc(booked)}
              </small>

              <small>
                Current: ${esc(current)}
              </small>

              ${
                coach !== "-" || berth !== "-"
                ? `<small>Seat: ${esc(coach)} / ${esc(berth)}</small>`
                : ""
              }
            </div>

            <div class="passenger-status ${statusClass(current)}">
              ${esc(current)}
            </div>

          </div>
        `;
      }).join("")
    : `
      <div class="passenger">
        <div>
          <strong>Passenger Details</strong>
          <small>Passenger information is not available in the response.</small>
        </div>
      </div>
    `;

  resultBox.innerHTML = `

    <div class="result-head">

      <div>
        <small>PNR RESULT</small>
        <h3>PNR ${esc(pnr)}</h3>
      </div>

      <div class="status ${statusClass(overallStatus)}">
        ${esc(overallStatus)}
      </div>

    </div>

    <div class="journey">

      <div class="station">
        <small>FROM</small>
        <strong>${esc(from)}</strong>
      </div>

      <div class="arrow">→</div>

      <div class="station right">
        <small>TO</small>
        <strong>${esc(to)}</strong>
      </div>

    </div>

    <div class="info-grid">

      <div class="info">
        <small>TRAIN</small>
        <strong>${esc(trainName)}</strong>
      </div>

      <div class="info">
        <small>TRAIN NUMBER</small>
        <strong>${esc(trainNumber)}</strong>
      </div>

      <div class="info">
        <small>JOURNEY DATE</small>
        <strong>${esc(date)}</strong>
      </div>

      <div class="info">
        <small>CLASS</small>
        <strong>${esc(cls)}</strong>
      </div>

      <div class="info">
        <small>QUOTA</small>
        <strong>${esc(quota)}</strong>
      </div>

      <div class="info">
        <small>FARE</small>
        <strong>${esc(fare)}</strong>
      </div>

    </div>

    <div class="passengers">

      <h4>
        Passenger Details
      </h4>

      ${passengerHTML}

    </div>
  `;

  resultBox.classList.remove("hidden");

  resultBox.scrollIntoView({
    behavior:"smooth",
    block:"nearest"
  });
}

async function checkPNR(){

  const pnr = pnrInput.value.trim();

  errorBox.classList.add("hidden");
  resultBox.classList.add("hidden");

  if(!/^\d{10}$/.test(pnr)){
    errorBox.textContent =
      "Please enter a valid 10-digit PNR number.";
    errorBox.classList.remove("hidden");
    return;
  }

  checkBtn.disabled = true;
  loading.classList.remove("hidden");

  try{

    const response = await fetch(
      `/api/pnr?pnr=${encodeURIComponent(pnr)}`,
      {
        method:"GET",
        headers:{
          "Accept":"application/json"
        },
        cache:"no-store"
      }
    );

    const text = await response.text();

    let data;

    try{
      data = JSON.parse(text);
    }catch{
      throw new Error(
        "Server returned an invalid response."
      );
    }

    if(!response.ok || data?.success === false){
      throw new Error(
        data?.message ||
        data?.error ||
        "PNR status could not be fetched."
      );
    }

    renderResult(data,pnr);

  }catch(error){

    console.error("AINEX PNR:",error);

    errorBox.textContent =
      error.message ||
      "Unable to fetch PNR status.";

    errorBox.classList.remove("hidden");

  }finally{

    checkBtn.disabled = false;
    loading.classList.add("hidden");

  }
}

checkBtn.addEventListener("click",checkPNR);

pnrInput.addEventListener("input",()=>{
  pnrInput.value =
    pnrInput.value.replace(/\D/g,"").slice(0,10);
});

pnrInput.addEventListener("keydown",(e)=>{
  if(e.key === "Enter"){
    e.preventDefault();
    checkPNR();
  }
});
