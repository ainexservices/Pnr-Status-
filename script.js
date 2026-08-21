const form = document.getElementById("pnrForm");
const input = document.getElementById("pnr");
const button = document.getElementById("checkBtn");
const resultBox = document.getElementById("result");
const errorBox = document.getElementById("error");
const loading = document.getElementById("loading");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const pnr = input.value.replace(/\D/g, "");

  errorBox?.classList.add("hidden");
  resultBox?.classList.add("hidden");

  if (!/^\d{10}$/.test(pnr)) {
    showError("Please enter a valid 10-digit PNR number.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`/api/pnr?pnr=${encodeURIComponent(pnr)}`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server returned an invalid response.");
    }

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.message ||
        data?.error ||
        "Unable to fetch PNR status."
      );
    }

    renderResult(data, pnr);

  } catch (error) {
    console.error("PNR Error:", error);
    showError(error.message || "Unable to fetch PNR status.");
  } finally {
    setLoading(false);
  }
});


/* =========================
   LOADING
========================= */

function setLoading(active) {
  if (!button) return;

  button.disabled = active;

  if (active) {
    button.innerHTML = `
      <span class="btn-loader"></span>
      Checking PNR...
    `;
  } else {
    button.innerHTML = "🔎 Check Status";
  }

  loading?.classList.toggle("hidden", !active);
}


/* =========================
   ERROR
========================= */

function showError(message) {
  if (!errorBox) {
    alert(message);
    return;
  }

  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}


/* =========================
   RESULT
========================= */

function renderResult(data, pnr) {
  if (!resultBox) return;

  const root = data?.data || data?.result || data;

  const passengers =
    root?.passengers ||
    root?.passenger ||
    root?.booking?.passengers ||
    [];

  const train =
    root?.train ||
    root?.trainDetails ||
    {};

  const journey =
    root?.journey ||
    root?.journeyDetails ||
    {};

  const status =
    root?.status ||
    root?.pnrStatus ||
    root?.bookingStatus ||
    "Unknown";

  const trainName =
    train?.name ||
    train?.trainName ||
    root?.trainName ||
    "Railway Journey";

  const trainNumber =
    train?.number ||
    train?.trainNumber ||
    root?.trainNumber ||
    "-";

  const from =
    journey?.from ||
    journey?.boarding ||
    root?.from ||
    root?.boardingStation ||
    "-";

  const to =
    journey?.to ||
    journey?.destination ||
    root?.to ||
    root?.destinationStation ||
    "-";

  const date =
    journey?.date ||
    root?.journeyDate ||
    root?.date ||
    "-";

  const coach =
    root?.coach ||
    root?.class ||
    root?.bookingClass ||
    "-";

  resultBox.innerHTML = `
    <div class="result-head">
      <div>
        <span>PNR RESULT</span>
        <h2>PNR ${escapeHTML(pnr)}</h2>
      </div>

      <div class="status-badge">
        ${escapeHTML(formatStatus(status))}
      </div>
    </div>

    <div class="journey">

      <div class="station">
        <small>FROM</small>
        <strong>${escapeHTML(from)}</strong>
      </div>

      <div class="journey-line">🚆</div>

      <div class="station right">
        <small>TO</small>
        <strong>${escapeHTML(to)}</strong>
      </div>

    </div>

    <div class="info-grid">

      <div class="info">
        <small>TRAIN</small>
        <strong>${escapeHTML(trainNumber)}</strong>
      </div>

      <div class="info">
        <small>TRAIN NAME</small>
        <strong>${escapeHTML(trainName)}</strong>
      </div>

      <div class="info">
        <small>JOURNEY DATE</small>
        <strong>${escapeHTML(date)}</strong>
      </div>

      <div class="info">
        <small>CLASS</small>
        <strong>${escapeHTML(coach)}</strong>
      </div>

      <div class="info">
        <small>PNR NUMBER</small>
        <strong>${escapeHTML(pnr)}</strong>
      </div>

      <div class="info">
        <small>STATUS</small>
        <strong>${escapeHTML(formatStatus(status))}</strong>
      </div>

    </div>

    <div class="passenger-section">

      <div class="section-title">
        <h3>Passenger Status</h3>
        <span>${Array.isArray(passengers) ? passengers.length : 0} Passenger(s)</span>
      </div>

      ${
        Array.isArray(passengers) && passengers.length
          ? passengers.map((passenger, index) => passengerHTML(passenger, index)).join("")
          : `
            <div class="passenger">
              <div>
                <strong>Passenger Information</strong>
                <span>Status details are available from the railway response.</span>
              </div>
            </div>
          `
      }

    </div>
  `;

  resultBox.classList.remove("hidden");
  resultBox.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================
   PASSENGER CARD
========================= */

function passengerHTML(passenger, index) {

  const name =
    passenger?.name ||
    passenger?.passengerName ||
    passenger?.details?.name ||
    `Passenger ${index + 1}`;

  const booking =
    passenger?.booking?.details ||
    passenger?.bookingStatus ||
    passenger?.booking ||
    "-";

  const current =
    passenger?.current?.details ||
    passenger?.currentStatus ||
    passenger?.current ||
    "-";

  return `
    <div class="passenger">

      <div>
        <strong>${escapeHTML(name)}</strong>

        <span>
          Booking:
          ${escapeHTML(valueToText(booking))}
        </span>

        <span>
          Current:
          ${escapeHTML(valueToText(current))}
        </span>
      </div>

      <strong>
        ${escapeHTML(valueToText(current))}
      </strong>

    </div>
  `;
}


/* =========================
   HELPERS
========================= */

function valueToText(value) {
  if (value === null || value === undefined) return "-";

  if (typeof value === "object") {
    return (
      value?.details ||
      value?.status ||
      value?.value ||
      JSON.stringify(value)
    );
  }

  return String(value);
}


function formatStatus(status) {
  const value = String(status || "Unknown").toUpperCase();

  if (
    value.includes("CNF") ||
    value.includes("CONFIRM")
  ) {
    return "✓ CNF Confirmed";
  }

  if (value.includes("RAC")) {
    return "● RAC";
  }

  if (
    value.includes("WL") ||
    value.includes("WAIT")
  ) {
    return "● WL Waiting";
  }

  return status || "Unknown";
}


function escapeHTML(value) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   PNR INPUT
========================= */

input?.addEventListener("input", () => {
  input.value = input.value
    .replace(/\D/g, "")
    .slice(0, 10);
});
