const input = document.getElementById("pnrInput");
const button = document.getElementById("checkBtn");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("resultBox");


// PNR input - only numbers
input.addEventListener("input", () => {
  input.value = input.value.replace(/\D/g, "").slice(0, 10);
  errorBox.textContent = "";
});


// Enter key
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    checkPNR();
  }
});


// Check button
button.addEventListener("click", checkPNR);


async function checkPNR() {

  const pnr = input.value.trim();

  errorBox.textContent = "";
  resultBox.innerHTML = "";

  if (!/^\d{10}$/.test(pnr)) {
    errorBox.textContent = "Please enter a valid 10-digit PNR number.";
    input.focus();
    return;
  }


  button.disabled = true;
  button.innerHTML = "⏳ Checking...";


  resultBox.innerHTML = `
    <div class="loading-card">
      <div class="loading-spinner"></div>
      <strong>Checking PNR Status</strong>
      <span>Please wait while we fetch the latest information...</span>
    </div>
  `;


  try {

    const response = await fetch(
      `/api/pnr?pnr=${encodeURIComponent(pnr)}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      }
    );


    const contentType =
      response.headers.get("content-type") || "";


    let result;


    if (contentType.includes("application/json")) {

      result = await response.json();

    } else {

      const text = await response.text();

      throw new Error(
        text || "Server returned an invalid response."
      );

    }


    if (!response.ok || result?.success === false) {

      throw new Error(
        result?.message ||
        result?.error ||
        "Unable to fetch PNR status."
      );

    }


    const data = result?.data || result;

    showResult(data, pnr);


  } catch (error) {

    console.error("PNR Error:", error);

    resultBox.innerHTML = "";

    errorBox.textContent =
      error.message ||
      "Unable to fetch PNR status. Please try again.";

  } finally {

    button.disabled = false;
    button.innerHTML = `Check Status <span>→</span>`;

  }

}


function showResult(data, pnr) {

  const train = data?.train || {};
  const journey = data?.journey || {};

  const passengers =
    Array.isArray(data?.passengers)
      ? data.passengers
      : [];


  const source =
    journey?.source?.name ||
    journey?.source?.code ||
    data?.source ||
    "-";


  const destination =
    journey?.destination?.name ||
    journey?.destination?.code ||
    data?.destination ||
    "-";


  const trainNumber =
    train?.number ||
    data?.trainNumber ||
    "-";


  const trainName =
    train?.name ||
    data?.trainName ||
    "Train";


  const journeyDate =
    journey?.date ||
    data?.journeyDate ||
    "-";


  const travelClass =
    journey?.class ||
    data?.class ||
    "-";


  const chartStatus =
    data?.chartStatus ||
    data?.chart_status ||
    "-";


  const status =
    data?.status ||
    data?.pnrStatus ||
    "AVAILABLE";


  const passengerHTML = passengers.length

    ? passengers.map((passenger, index) => {

        const name =
          passenger?.name ||
          passenger?.passengerName ||
          `Passenger ${index + 1}`;


        const booking =
          passenger?.booking?.details ||
          passenger?.booking?.status ||
          passenger?.bookingStatus ||
          "-";


        const current =
          passenger?.current?.details ||
          passenger?.current?.status ||
          passenger?.currentStatus ||
          "-";


        const coach =
          passenger?.current?.coach ||
          passenger?.coach ||
          "-";


        const berth =
          passenger?.current?.berth ||
          passenger?.berth ||
          "-";


        return `

          <div class="passenger">

            <strong>
              ${escapeHTML(name)}
            </strong>

            <span>
              Booking:
              <b>${escapeHTML(booking)}</b>
            </span>

            <span>
              Current:
              <b>${escapeHTML(current)}</b>
            </span>

            <span>
              Coach:
              <b>${escapeHTML(coach)}</b>
            </span>

            <span>
              Berth:
              <b>${escapeHTML(berth)}</b>
            </span>

          </div>

        `;

      }).join("")

    : `

      <div class="passenger">

        <strong>
          Passenger Information
        </strong>

        <span>
          Passenger details are not available in the API response.
        </span>

      </div>

    `;


  resultBox.innerHTML = `

    <div class="result">

      <div class="result-head">

        <div>

          <small>PNR NUMBER</small>

          <div class="pnr">
            ${escapeHTML(data?.pnr || pnr)}
          </div>

        </div>

        <div class="status">
          ${escapeHTML(status)}
        </div>

      </div>


      <div class="train">

        🚆 ${escapeHTML(trainNumber)}
        -
        ${escapeHTML(trainName)}

      </div>


      <div class="grid">

        <div class="item">

          <small>Journey Date</small>

          <b>
            ${escapeHTML(journeyDate)}
          </b>

        </div>


        <div class="item">

          <small>From</small>

          <b>
            ${escapeHTML(source)}
          </b>

        </div>


        <div class="item">

          <small>To</small>

          <b>
            ${escapeHTML(destination)}
          </b>

        </div>


        <div class="item">

          <small>Class</small>

          <b>
            ${escapeHTML(travelClass)}
          </b>

        </div>


        <div class="item">

          <small>Chart Status</small>

          <b>
            ${escapeHTML(chartStatus)}
          </b>

        </div>


        <div class="item">

          <small>Passengers</small>

          <b>
            ${passengers.length || "-"}
          </b>

        </div>

      </div>


      <div class="passengers">

        <h3>
          👤 Passenger Status
        </h3>

        ${passengerHTML}

      </div>


      <div class="result-actions">

        <button
          type="button"
          class="secondary-btn"
          onclick="refreshPNR('${escapeHTML(pnr)}')"
        >
          🔄 Refresh
        </button>


        <button
          type="button"
          class="secondary-btn"
          onclick="sharePNR('${escapeHTML(pnr)}')"
        >
          📤 Share
        </button>


        <button
          type="button"
          class="secondary-btn"
          onclick="printPNR()"
        >
          🖨️ Print
        </button>

      </div>

    </div>

  `;


  resultBox.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


function refreshPNR(pnr) {

  input.value = pnr;

  checkPNR();

}


async function sharePNR(pnr) {

  const shareData = {

    title: "AINEX E Ticket - PNR Status",

    text:
      `Check PNR Status: ${pnr}`,

    url: window.location.href

  };


  try {

    if (navigator.share) {

      await navigator.share(shareData);

    } else {

      await navigator.clipboard.writeText(
        `PNR: ${pnr}\n${window.location.href}`
      );

      alert("PNR link copied!");

    }

  } catch (error) {

    console.log("Share cancelled.");

  }

}


function printPNR() {

  window.print();

}


function escapeHTML(value) {

  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
