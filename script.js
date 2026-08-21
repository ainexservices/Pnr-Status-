const input = document.getElementById("pnrInput");
const button = document.getElementById("checkBtn");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("resultBox");

input.addEventListener("input", () => {
  input.value = input.value.replace(/\D/g, "").slice(0, 10);
  errorBox.textContent = "";
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter") checkPNR();
});

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
  button.textContent = "⏳ Checking...";

  resultBox.innerHTML = `
    <div class="loading-card">
      <div class="loading-spinner"></div>
      <strong>Checking PNR Status</strong>
      <span>Please wait...</span>
    </div>
  `;

  try {

    const response = await fetch(
      `/api/pnr?pnr=${encodeURIComponent(pnr)}`,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    const type = response.headers.get("content-type") || "";

    if (!type.includes("application/json")) {
      const text = await response.text();
      throw new Error(text || "Server returned an invalid response.");
    }

    const result = await response.json();

    if (!response.ok || result?.success === false) {
      throw new Error(
        result?.message ||
        result?.error ||
        "Unable to fetch PNR status."
      );
    }

    showResult(result?.data || result, pnr);

  } catch (error) {

    console.error(error);

    resultBox.innerHTML = "";

    errorBox.textContent =
      error.message || "Unable to fetch PNR status.";

  } finally {

    button.disabled = false;
    button.textContent = "🔍 Check Status";

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


  const statusClass = getStatusClass(status);


  const passengerHTML = passengers.length

    ? passengers.map((p, i) => {

        const name =
          p?.name ||
          p?.passengerName ||
          `Passenger ${i + 1}`;

        const booking =
          p?.booking?.details ||
          p?.booking?.status ||
          p?.bookingStatus ||
          "-";

        const current =
          p?.current?.details ||
          p?.current?.status ||
          p?.currentStatus ||
          "-";

        const coach =
          p?.current?.coach ||
          p?.coach ||
          "-";

        const berth =
          p?.current?.berth ||
          p?.berth ||
          "-";

        return `
          <div class="passenger">

            <strong>
              👤 ${escapeHTML(name)}
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
        <strong>👤 Passenger Details</strong>
        <span>Passenger information is not available.</span>
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

        <div class="status ${statusClass}">
          ${escapeHTML(status)}
        </div>

      </div>


      <div class="train">
        🚆 ${escapeHTML(trainNumber)}
        - ${escapeHTML(trainName)}
      </div>


      <div class="grid">

        <div class="item">
          <small>Journey Date</small>
          <b>${escapeHTML(journeyDate)}</b>
        </div>

        <div class="item">
          <small>From</small>
          <b>${escapeHTML(source)}</b>
        </div>

        <div class="item">
          <small>To</small>
          <b>${escapeHTML(destination)}</b>
        </div>

        <div class="item">
          <small>Class</small>
          <b>${escapeHTML(travelClass)}</b>
        </div>

        <div class="item">
          <small>Chart Status</small>
          <b>${escapeHTML(chartStatus)}</b>
        </div>

        <div class="item">
          <small>Passengers</small>
          <b>${passengers.length || "-"}</b>
        </div>

      </div>


      <div class="passengers">

        <h3>Passenger Status</h3>

        ${passengerHTML}

      </div>


      <div class="result-actions">

        <button
          class="secondary-btn"
          onclick="refreshPNR('${escapeHTML(pnr)}')">
          🔄 Refresh
        </button>

        <button
          class="secondary-btn"
          onclick="sharePNR('${escapeHTML(pnr)}')">
          📤 Share
        </button>

        <button
          class="secondary-btn"
          onclick="window.print()">
          🖨️ Print
        </button>

      </div>

    </div>
  `;

  resultBox.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}


function getStatusClass(status) {

  const value = String(status).toUpperCase();

  if (
    value.includes("CNF") ||
    value.includes("CONFIRM")
  ) {
    return "status-confirmed";
  }

  if (value.includes("RAC")) {
    return "status-rac";
  }

  if (
    value.includes("WL") ||
    value.includes("WAIT")
  ) {
    return "status-wl";
  }

  return "";
}


function refreshPNR(pnr) {
  input.value = pnr;
  checkPNR();
}


async function sharePNR(pnr) {

  const shareData = {
    title: "AINEX E Ticket - PNR Status",
    text: `Check PNR Status: ${pnr}`,
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

  } catch (e) {
    console.log("Share cancelled.");
  }
}


function escapeHTML(value) {

  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
