const form = document.getElementById("pnrForm");
const input = document.getElementById("pnr");
const button = document.getElementById("checkBtn");
const resultBox = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const pnr = input.value.replace(/\D/g, "");

  if (pnr.length !== 10) {
    showError("Please enter a valid 10-digit PNR number.");
    return;
  }

  button.disabled = true;
  button.innerHTML = "⏳ Checking...";
  resultBox.innerHTML = `
    <div class="loading">
      <div class="loader"></div>
      <b>Checking PNR Status...</b>
      <span>Please wait a moment</span>
    </div>
  `;

  try {
    const response = await fetch(`/api/pnr?pnr=${pnr}`);
    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || result.error || "Unable to fetch PNR status.");
    }

    renderResult(result.data);

  } catch (error) {
    console.error("PNR Error:", error);
    showError(error.message || "Something went wrong.");
  }

  button.disabled = false;
  button.innerHTML = "🔎 Check Status";
});

function renderResult(d) {
  const train = d?.train || {};
  const journey = d?.journey || {};
  const source = journey?.source || {};
  const destination = journey?.destination || {};
  const booking = d?.booking || {};
  const passengers = Array.isArray(d?.passengers) ? d.passengers : [];

  const status = getOverallStatus(passengers);

  resultBox.innerHTML = `
    <div class="result-card">

      <div class="result-head">
        <div>
          <small>PNR RESULT</small>
          <h2>PNR ${safe(d?.pnr)}</h2>
          <p>${status.label}</p>
        </div>
        <div class="status-badge ${status.class}">
          ${status.code}
        </div>
      </div>

      <div class="route">
        <div>
          <small>FROM</small>
          <strong>${safe(source.name)}</strong>
          <span>${safe(source.code)}</span>
        </div>

        <div class="arrow">→</div>

        <div class="right">
          <small>TO</small>
          <strong>${safe(destination.name)}</strong>
          <span>${safe(destination.code)}</span>
        </div>
      </div>

      <div class="info-grid">

        <div>
          <small>TRAIN</small>
          <strong>${safe(train.name)}</strong>
        </div>

        <div>
          <small>TRAIN NUMBER</small>
          <strong>${safe(train.number)}</strong>
        </div>

        <div>
          <small>JOURNEY DATE</small>
          <strong>${safe(journey.dateOfJourney)}</strong>
        </div>

        <div>
          <small>CLASS</small>
          <strong>${safe(journey.class)}</strong>
        </div>

        <div>
          <small>QUOTA</small>
          <strong>${safe(journey.quota)}</strong>
        </div>

        <div>
          <small>CHART</small>
          <strong>${safe(d?.chart?.status)}</strong>
        </div>

        <div>
          <small>FARE</small>
          <strong>₹${safe(booking.fare)}</strong>
        </div>

        <div>
          <small>PNR</small>
          <strong>${safe(d?.pnr)}</strong>
        </div>

      </div>

      <div class="passenger-title">
        Passenger Details
        <span>${passengers.length} Passenger${passengers.length !== 1 ? "s" : ""}</span>
      </div>

      <div class="passengers">
        ${
          passengers.length
            ? passengers.map((p, i) => passengerHTML(p, i)).join("")
            : `<div class="empty">Passenger information not available.</div>`
        }
      </div>

      <div class="privacy">
        🔒 Your PNR is used only to fetch the current status.
      </div>

    </div>
  `;

  resultBox.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function passengerHTML(p, index) {
  const booking = p?.booking || {};
  const current = p?.current || {};

  const currentStatus =
    current.status ||
    getStatusCode(current.details) ||
    "-";

  const statusClass = statusColor(currentStatus);

  return `
    <div class="passenger">

      <div class="passenger-top">
        <strong>${safe(p?.serialNumber || `Passenger ${index + 1}`)}</strong>

        <span class="passenger-status ${statusClass}">
          ${safe(currentStatus)}
        </span>
      </div>

      <div class="passenger-grid">

        <div>
          <small>BOOKING STATUS</small>
          <strong>${safe(booking.details || booking.status)}</strong>
        </div>

        <div>
          <small>CURRENT STATUS</small>
          <strong>${safe(current.details || current.status)}</strong>
        </div>

        <div>
          <small>COACH</small>
          <strong>${safe(current.coach || booking.coach)}</strong>
        </div>

        <div>
          <small>BERTH</small>
          <strong>
            ${safe(current.berthNo || booking.berthNo)}
            ${current.berthCode ? ` (${safe(current.berthCode)})` : ""}
          </strong>
        </div>

      </div>

    </div>
  `;
}

function getOverallStatus(passengers) {
  if (!passengers.length) {
    return {
      code: "—",
      label: "Status Available",
      class: "unknown"
    };
  }

  const statuses = passengers.map(p =>
    String(
      p?.current?.status ||
      getStatusCode(p?.current?.details) ||
      p?.booking?.status ||
      ""
    ).toUpperCase()
  );

  if (statuses.every(s => s === "CNF")) {
    return {
      code: "CNF",
      label: "Confirmed",
      class: "confirmed"
    };
  }

  if (statuses.some(s => s === "RAC")) {
    return {
      code: "RAC",
      label: "RAC Status",
      class: "rac"
    };
  }

  if (statuses.some(s => s.includes("WL"))) {
    return {
      code: "WL",
      label: "Waiting List",
      class: "waiting"
    };
  }

  if (statuses.some(s => s === "CAN")) {
    return {
      code: "CAN",
      label: "Cancelled",
      class: "cancelled"
    };
  }

  return {
    code: statuses[0] || "—",
    label: "Status Available",
    class: "unknown"
  };
}

function getStatusCode(value) {
  if (!value) return "";

  const text = String(value).toUpperCase();

  if (text.includes("CNF")) return "CNF";
  if (text.includes("RAC")) return "RAC";
  if (text.includes("WL")) return "WL";
  if (text.includes("CAN")) return "CAN";

  return "";
}

function statusColor(status) {
  status = String(status).toUpperCase();

  if (status === "CNF") return "confirmed";
  if (status === "RAC") return "rac";
  if (status.includes("WL")) return "waiting";
  if (status === "CAN") return "cancelled";

  return "unknown";
}

function safe(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "[object Object]"
  ) {
    return "-";
  }

  if (typeof value === "object") {
    if (value.name) return String(value.name);
    if (value.code) return String(value.code);
    if (value.details) return String(value.details);
    return "-";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showError(message) {
  resultBox.innerHTML = `
    <div class="error-box">
      <div class="error-icon">!</div>
      <div>
        <strong>Unable to fetch PNR</strong>
        <p>${safe(message)}</p>
      </div>
    </div>
  `;
}
