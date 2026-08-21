const pnrInput = document.getElementById("pnr");
const checkBtn = document.getElementById("checkBtn");
const resultBox = document.getElementById("result");
const errorBox = document.getElementById("error");
const loading = document.getElementById("loading");

function hide(el) {
  if (el) el.classList.add("hidden");
}

function show(el) {
  if (el) el.classList.remove("hidden");
}

function escapeHTML(value) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStatusClass(status = "") {
  const s = String(status).toUpperCase();

  if (s.includes("CNF") || s.includes("CONFIRM")) return "confirmed";
  if (s.includes("RAC")) return "rac";
  if (s.includes("WL") || s.includes("WAIT")) return "waiting";

  return "";
}

function getStatusText(data) {
  return (
    data?.status ||
    data?.pnrStatus ||
    data?.bookingStatus ||
    data?.currentStatus ||
    data?.message ||
    "Status Available"
  );
}

function findValue(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return "-";
}

function renderResult(data, pnr) {
  const status = getStatusText(data);
  const statusClass = getStatusClass(status);

  const trainName = findValue(data, [
    "trainName",
    "train_name",
    "train"
  ]);

  const trainNumber = findValue(data, [
    "trainNumber",
    "train_number",
    "trainNo"
  ]);

  const from = findValue(data, [
    "from",
    "source",
    "boardingStation",
    "fromStation"
  ]);

  const to = findValue(data, [
    "to",
    "destination",
    "destinationStation",
    "toStation"
  ]);

  const date = findValue(data, [
    "journeyDate",
    "journey_date",
    "date",
    "doj"
  ]);

  const quota = findValue(data, [
    "quota",
    "bookingQuota"
  ]);

  let passengers = [];

  if (Array.isArray(data?.passengers)) {
    passengers = data.passengers;
  } else if (Array.isArray(data?.data?.passengers)) {
    passengers = data.data.passengers;
  }

  const main = data?.data && typeof data.data === "object"
    ? { ...data, ...data.data }
    : data;

  const finalTrainName = findValue(main, [
    "trainName",
    "train_name",
    "train"
  ]);

  const finalTrainNumber = findValue(main, [
    "trainNumber",
    "train_number",
    "trainNo"
  ]);

  const finalFrom = findValue(main, [
    "from",
    "source",
    "boardingStation",
    "fromStation"
  ]);

  const finalTo = findValue(main, [
    "to",
    "destination",
    "destinationStation",
    "toStation"
  ]);

  const finalDate = findValue(main, [
    "journeyDate",
    "journey_date",
    "date",
    "doj"
  ]);

  const finalQuota = findValue(main, [
    "quota",
    "bookingQuota"
  ]);

  if (Array.isArray(main?.passengers)) {
    passengers = main.passengers;
  }

  const passengerHTML = passengers.length
    ? passengers.map((p, i) => {

        const booking = findValue(p, [
          "booking",
          "bookingStatus",
          "booking_status"
        ]);

        const current = findValue(p, [
          "current",
          "currentStatus",
          "current_status"
        ]);

        const passengerName = findValue(p, [
          "name",
          "passengerName"
        ]);

        const cls = getStatusClass(current);

        return `
          <div class="passenger">
            <div>
              <strong>
                Passenger ${i + 1}${passengerName !== "-" ? ` — ${escapeHTML(passengerName)}` : ""}
              </strong>
              <span>Booking: ${escapeHTML(booking)}</span>
              <span>Current: ${escapeHTML(current)}</span>
            </div>

            <div class="passenger-status ${cls}">
              ${escapeHTML(current)}
            </div>
          </div>
        `;
      }).join("")
    : `
      <div class="passenger">
        <div>
          <strong>Passenger Information</strong>
          <span>Passenger details were returned by the railway service.</span>
        </div>
      </div>
    `;

  resultBox.innerHTML = `
    <div class="result-head">
      <div>
        <span>PNR RESULT</span>
        <h2>PNR ${escapeHTML(pnr)}</h2>
      </div>

      <div class="status-badge ${statusClass}">
        ${escapeHTML(status)}
      </div>
    </div>

    <div class="journey">

      <div class="station">
        <small>FROM</small>
        <strong>${escapeHTML(finalFrom)}</strong>
      </div>

      <div class="journey-line">→</div>

      <div class="station right">
        <small>TO</small>
        <strong>${escapeHTML(finalTo)}</strong>
      </div>

    </div>

    <div class="info-grid">

      <div class="info">
        <small>TRAIN</small>
        <strong>${escapeHTML(finalTrainName)}</strong>
      </div>

      <div class="info">
        <small>TRAIN NUMBER</small>
        <strong>${escapeHTML(finalTrainNumber)}</strong>
      </div>

      <div class="info">
        <small>JOURNEY DATE</small>
        <strong>${escapeHTML(finalDate)}</strong>
      </div>

      <div class="info">
        <small>QUOTA</small>
        <strong>${escapeHTML(finalQuota)}</strong>
      </div>

      <div class="info">
        <small>PNR NUMBER</small>
        <strong>${escapeHTML(pnr)}</strong>
      </div>

      <div class="info">
        <small>STATUS</small>
        <strong>${escapeHTML(status)}</strong>
      </div>

    </div>

    <div class="passenger-section">

      <div class="section-title">
        <h3>Passenger Details</h3>
        <span>${passengers.length || 0} Passenger</span>
      </div>

      ${passengerHTML}

    </div>
  `;

  show(resultBox);

  resultBox.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


async function checkPNR() {

  const pnr = pnrInput?.value.trim();

  hide(errorBox);
  hide(resultBox);

  if (!pnr) {
    errorBox.textContent = "Please enter your 10-digit PNR number.";
    show(errorBox);
    return;
  }

  if (!/^\d{10}$/.test(pnr)) {
    errorBox.textContent = "PNR number must contain exactly 10 digits.";
    show(errorBox);
    return;
  }

  checkBtn.disabled = true;

  if (loading) {
    show(loading);
  }

  try {

    const response = await fetch(
      `/api/pnr?pnr=${encodeURIComponent(pnr)}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        cache: "no-store"
      }
    );

    const contentType =
      response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {

      const text = await response.text();

      throw new Error(
        text || `Server returned HTTP ${response.status}`
      );
    }

    if (!response.ok || data?.success === false) {

      throw new Error(
        data?.message ||
        data?.error ||
        `PNR request failed (${response.status})`
      );
    }

    renderResult(data, pnr);

  } catch (error) {

    console.error("AINEX PNR Error:", error);

    errorBox.textContent =
      error?.message ||
      "PNR status fetch nahi ho saka. Please try again.";

    show(errorBox);

  } finally {

    checkBtn.disabled = false;

    if (loading) {
      hide(loading);
    }
  }
}


/* Button */
if (checkBtn) {
  checkBtn.addEventListener("click", checkPNR);
}


/* Enter key */
if (pnrInput) {
  pnrInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkPNR();
    }
  });

  pnrInput.addEventListener("input", () => {
    pnrInput.value = pnrInput.value
      .replace(/\D/g, "")
      .slice(0, 10);
  });
}
