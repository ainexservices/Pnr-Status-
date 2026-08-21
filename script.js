const pnrInput = document.getElementById("pnrInput");
const checkBtn = document.getElementById("checkBtn");
const btnText = document.getElementById("btnText");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("errorBox");
const resultSection = document.getElementById("resultSection");
const resultBox = document.getElementById("resultBox");
const clearBtn = document.getElementById("clearBtn");

pnrInput.addEventListener("input", () => {
  pnrInput.value = pnrInput.value.replace(/\D/g, "").slice(0, 10);
  clearBtn.style.display = pnrInput.value ? "block" : "none";
  errorBox.classList.add("hidden");
});

clearBtn.addEventListener("click", () => {
  pnrInput.value = "";
  clearBtn.style.display = "none";
  pnrInput.focus();
});

checkBtn.addEventListener("click", checkPNR);

pnrInput.addEventListener("keydown", e => {
  if(e.key === "Enter") checkPNR();
});

async function checkPNR(){

  const pnr = pnrInput.value.trim();

  errorBox.classList.add("hidden");

  if(!/^\d{10}$/.test(pnr)){
    showError("Please enter a valid 10-digit PNR number.");
    return;
  }

  setLoading(true);

  try{

    const response = await fetch(`/api/pnr?pnr=${encodeURIComponent(pnr)}`, {
      method:"GET",
      headers:{
        "Accept":"application/json"
      }
    });

    const text = await response.text();

    let data;

    try{
      data = JSON.parse(text);
    }catch{
      throw new Error(
        "PNR service returned an invalid response. Please try again."
      );
    }

    if(!response.ok || data.success === false){
      throw new Error(
        data.message ||
        data.error ||
        "Unable to fetch PNR status."
      );
    }

    renderResult(data);

  }catch(error){

    console.error(error);

    showError(
      error.message ||
      "Unable to check PNR right now. Please try again."
    );

  }finally{
    setLoading(false);
  }
}


function setLoading(status){

  checkBtn.disabled = status;

  if(status){

    btnText.classList.add("hidden");
    loader.classList.remove("hidden");

  }else{

    btnText.classList.remove("hidden");
    loader.classList.add("hidden");

  }
}


function showError(message){

  errorBox.textContent = "⚠️ " + message;
  errorBox.classList.remove("hidden");

  resultSection.classList.add("hidden");
}


function renderResult(data){

  const pnr =
    data.PnrNumber ||
    data.pnrNumber ||
    data.pnr ||
    pnrInput.value;

  const trainNumber =
    data.TrainNumber ||
    data.trainNumber ||
    "-";

  const trainName =
    data.TrainName ||
    data.trainName ||
    "Train";

  const from =
    data.From ||
    data.from ||
    "-";

  const to =
    data.To ||
    data.to ||
    "-";

  const journeyDate =
    data.JourneyDate ||
    data.journeyDate ||
    "-";

  const journeyClass =
    data.JourneyClass ||
    data.journeyClass ||
    "-";

  const passengers =
    data.Passengers ||
    data.passengers ||
    [];

  resultBox.innerHTML = `

    <div class="result-card">

      <div class="result-head">

        <div>
          <h2>🎫 PNR Status</h2>
          <p>Your latest railway reservation information</p>
        </div>

        <div class="pnr-number">
          PNR ${escapeHTML(pnr)}
        </div>

      </div>


      <div class="train-info">

        <div class="info-item">
          <small>TRAIN</small>
          <strong>${escapeHTML(trainNumber)}</strong>
        </div>

        <div class="info-item">
          <small>TRAIN NAME</small>
          <strong>${escapeHTML(trainName)}</strong>
        </div>

        <div class="info-item">
          <small>FROM</small>
          <strong>${escapeHTML(from)}</strong>
        </div>

        <div class="info-item">
          <small>TO</small>
          <strong>${escapeHTML(to)}</strong>
        </div>

        <div class="info-item">
          <small>JOURNEY DATE</small>
          <strong>${escapeHTML(journeyDate)}</strong>
        </div>

        <div class="info-item">
          <small>CLASS</small>
          <strong>${escapeHTML(journeyClass)}</strong>
        </div>

        <div class="info-item">
          <small>PASSENGERS</small>
          <strong>${passengers.length || "-"}</strong>
        </div>

        <div class="info-item">
          <small>STATUS</small>
          <strong>${getOverallStatus(passengers)}</strong>
        </div>

      </div>


      <div class="passengers">

        <h3>Passenger Status</h3>

        ${
          passengers.length
          ? passengers.map((p,i) => passengerHTML(p,i)).join("")
          : `<p style="color:#718096">
               Passenger information not available.
             </p>`
        }

      </div>


      <div class="result-actions">

        <button class="copy-btn" onclick="copyPNR('${escapeHTML(pnr)}')">
          📋 Copy PNR
        </button>

        <button class="another-btn" onclick="checkAnother()">
          🔄 Check Another PNR
        </button>

      </div>

    </div>
  `;

  resultSection.classList.remove("hidden");

  setTimeout(() => {
    resultSection.scrollIntoView({
      behavior:"smooth",
      block:"start"
    });
  },100);
}


function passengerHTML(p,index){

  const booking =
    p.BookingStatus ||
    p.bookingStatus ||
    p.booking?.details ||
    p.booking?.status ||
    "-";

  const current =
    p.CurrentStatus ||
    p.currentStatus ||
    p.current?.details ||
    p.current?.status ||
    "-";

  const statusClass = getStatusClass(current);

  return `

    <div class="passenger">

      <div>

        <div class="passenger-name">
          Passenger ${index + 1}
        </div>

        <div class="booking">
          Booking: ${escapeHTML(booking)}
        </div>

      </div>

      <div class="current ${statusClass}">
        Current: ${escapeHTML(current)}
      </div>

    </div>

  `;
}


function getStatusClass(status){

  const s = String(status).toUpperCase();

  if(
    s.includes("CNF") ||
    s.includes("CONFIRM")
  ){
    return "cnf";
  }

  if(s.includes("RAC")){
    return "rac";
  }

  if(
    s.includes("WL") ||
    s.includes("WAIT")
  ){
    return "wl";
  }

  return "";
}


function getOverallStatus(passengers){

  if(!passengers.length) return "-";

  const statuses = passengers.map(p =>
    String(
      p.CurrentStatus ||
      p.currentStatus ||
      p.current?.status ||
      ""
    ).toUpperCase()
  );

  if(statuses.some(s => s.includes("CNF")))
    return "CNF";

  if(statuses.some(s => s.includes("RAC")))
    return "RAC";

  if(statuses.some(s => s.includes("WL")))
    return "WL";

  return "Available";
}


function copyPNR(pnr){

  navigator.clipboard.writeText(pnr)
    .then(() => {
      alert("PNR copied: " + pnr);
    })
    .catch(() => {});
}


function checkAnother(){

  resultSection.classList.add("hidden");

  window.scrollTo({
    top:document.getElementById("pnr").offsetTop - 70,
    behavior:"smooth"
  });

  pnrInput.focus();
}


function escapeHTML(value){

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
