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
      <strong>Checking PNR Status...</strong>
      <span>Please wait...</span>
    </div>
  `;

  try {
    const response = await fetch(`/api/pnr?pnr=${pnr}`);
    const json = await response.json();

    if (!response.ok || json.success === false) {
      throw new Error(
        json.message ||
        json.error ||
        "Unable to fetch PNR status."
      );
    }

    renderResult(json.data || json);

  } catch (error) {
    console.error("PNR Error:", error);
    showError(error.message || "Unable to fetch PNR status.");
  }

  button.disabled = false;
  button.innerHTML = "🔎 Check Status";
});


function renderResult(data) {

  const train = data?.train || {};
  const journey = data?.journey || {};
  const source = journey?.source || {};
  const destination = journey?.destination || {};
  const booking = data?.booking || {};
  const passengers = Array.isArray(data?.passengers)
    ? data.passengers
    : [];

  const overall = getOverallStatus(passengers);

  resultBox.innerHTML = `
    <div class="result-card">

      <div class="result-head">
        <div>
          <small>PNR RESULT</small>
          <h2>PNR ${text(data?.pnr)}</h2>
          <p>${overall.label}</p>
        </div>

        <div class="status-badge ${overall.class}">
          ${overall.code}
        </div>
      </div>


      <div class="route">

        <div>
          <small>FROM</small>
          <strong>${locationText(source)}</strong>
        </div>

        <div class="arrow">→</div>

        <div class="right">
          <small>TO</small>
          <strong>${locationText(destination)}</strong>
        </div>

      </div>


      <div class="info-grid">

        <div>
          <small>TRAIN</small>
          <strong>${text(train?.name)}</strong>
        </div>

        <div>
          <small>TRAIN NUMBER</small>
          <strong>${text(train?.number)}</strong>
        </div>

        <div>
          <small>JOURNEY DATE</small>
          <strong>${text(
            journey?.dateOfJourney ||
            journey?.date ||
            data?.journeyDate
          )}</strong>
        </div>

        <div>
          <small>CLASS</small>
          <strong>${objectText(
            journey?.class ||
            journey?.travelClass
          )}</strong>
        </div>

        <div>
          <small>QUOTA</small>
          <strong>${objectText(journey?.quota)}</strong>
        </div>

        <div>
          <small>FARE</small>
          <strong>₹${objectText(
            booking?.fare ||
            data?.fare
          )}</strong>
        </div>

      </div>


      <div class="passenger-title">
        Passenger Details
        <span>
          ${passengers.length}
          Passenger${passengers.length !== 1 ? "s" : ""}
        </span>
      </div>


      <div class="passengers">

        ${
          passengers.length
            ? passengers.map((passenger, index) =>
                passengerHTML(passenger, index)
              ).join("")
            : `
              <div class="empty">
                Passenger information not available.
              </div>
            `
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


/* PASSENGER */

function passengerHTML(p, index) {

  const booking = p?.booking || {};
  const current = p?.current || {};

  const name =
    p?.name ||
    p?.passengerName ||
    p?.passenger?.name ||
    p?.details?.name ||
    `Passenger ${index + 1}`;

  const bookingStatus = objectText(
    booking?.details ||
    booking?.status ||
    booking
  );

  const currentStatus = objectText(
    current?.details ||
    current?.status ||
    current
  );

  const coach =
    objectText(
      current?.coach ||
      current?.coachNumber ||
      booking?.coach ||
      booking?.coachNumber
    );

  const berth =
    objectText(
      current?.berthNo ||
      current?.berth ||
      current?.berthNumber ||
      booking?.berthNo ||
      booking?.berth
    );

  const seat =
    objectText(
      current?.berthCode ||
      current?.seat ||
      booking?.berthCode
    );

  const statusCode =
    getStatusCode(currentStatus) ||
    getStatusCode(bookingStatus);

  return `
    <div class="passenger">

      <div class="passenger-top">

        <div>
          <strong>
            ${text(name)}
          </strong>
        </div>

        <span class="passenger-status ${statusColor(statusCode)}">
          ${text(statusCode || "STATUS")}
        </span>

      </div>


      <div class="passenger-grid">

        <div>
          <small>BOOKING STATUS</small>
          <strong>
            ${text(bookingStatus)}
          </strong>
        </div>


        <div>
          <small>CURRENT STATUS</small>
          <strong>
            ${text(currentStatus)}
          </strong>
        </div>


        <div>
          <small>COACH</small>
          <strong>
            ${text(coach)}
          </strong>
        </div>


        <div>
          <small>BERTH / SEAT</small>
          <strong>
            ${text(berth)}
            ${seat !== "-" ? ` (${text(seat)})` : ""}
          </strong>
        </div>

      </div>

    </div>
  `;
}


/* LOCATION */

function locationText(location) {

  if (!location) return "-";

  if (typeof location === "string") {
    return text(location);
  }

  const name =
    location?.name ||
    location?.stationName ||
    location?.station?.name ||
    location?.details?.name;

  const code =
    location?.code ||
    location?.stationCode ||
    location?.station?.code;

  if (name && typeof name === "string") {
    return `${text(name)}${code ? ` (${text(code)})` : ""}`;
  }

  if (code) {
    return text(code);
  }

  return objectText(location);
}


/* OBJECT → TEXT */

function objectText(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  if (typeof value === "string" ||
      typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(v => objectText(v))
      .filter(v => v !== "-")
      .join(", ") || "-";
  }

  if (typeof value === "object") {

    const keys = [
      "name",
      "value",
      "details",
      "status",
      "text",
      "description",
      "code",
      "number",
      "label"
    ];

    for (const key of keys) {

      if (
        value[key] !== undefined &&
        value[key] !== null &&
        value[key] !== ""
      ) {

        const result = objectText(value[key]);

        if (
          result !== "-" &&
          result !== "[object Object]"
        ) {
          return result;
        }
      }
    }

    return "-";
  }

  return "-";
}


/* SAFE TEXT */

function text(value) {

  const result = objectText(value);

  if (
    !result ||
    result === "[object Object]"
  ) {
    return "-";
  }

  return String(result)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* STATUS */

function getStatusCode(value) {

  const s = String(value || "").toUpperCase();

  if (s.includes("CNF")) return "CNF";
  if (s.includes("RAC")) return "RAC";
  if (s.includes("WL")) return "WL";
  if (s.includes("CAN")) return "CAN";

  return "";
}


function getOverallStatus(passengers) {

  if (!passengers.length) {
    return {
      code: "—",
      label: "Status Available",
      class: "unknown"
    };
  }

  const statuses = passengers.map(p => {

    const current = objectText(
      p?.current?.details ||
      p?.current?.status ||
      p?.current
    );

    const booking = objectText(
      p?.booking?.details ||
      p?.booking?.status ||
      p?.booking
    );

    return (
      getStatusCode(current) ||
      getStatusCode(booking)
    );
  });

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

  if (statuses.some(s => s === "WL")) {
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
    code: "—",
    label: "Status Available",
    class: "unknown"
  };
}


function statusColor(status) {

  if (status === "CNF") return "confirmed";
  if (status === "RAC") return "rac";
  if (status === "WL") return "waiting";
  if (status === "CAN") return "cancelled";

  return "unknown";
}


/* ERROR */

function showError(message) {

  resultBox.innerHTML = `
    <div class="error-box">

      <div class="error-icon">!</div>

      <div>
        <strong>Unable to fetch PNR</strong>
        <p>${text(message)}</p>
      </div>

    </div>
  `;
}
