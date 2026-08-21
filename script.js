const input = document.getElementById("pnrInput");
const button = document.getElementById("checkBtn");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const result = document.getElementById("result");

input.addEventListener("input", () => {
  input.value = input.value.replace(/\D/g, "").slice(0, 10);
  errorBox.classList.add("hidden");
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter") checkPNR();
});

button.addEventListener("click", checkPNR);

async function checkPNR() {

  const pnr = input.value.trim();

  errorBox.classList.add("hidden");
  result.classList.add("hidden");

  if (!/^\d{10}$/.test(pnr)) {
    showError("Please enter a valid 10-digit PNR number.");
    input.focus();
    return;
  }

  button.disabled = true;
  loading.classList.remove("hidden");

  try {

    const response = await fetch(
      `/api/pnr?pnr=${encodeURIComponent(pnr)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.message || "Unable to fetch PNR status."
      );
    }

    renderPNR(data);

  } catch (error) {

    console.error("AINEX PNR Error:", error);

    showError(
      error?.message ||
      "PNR status could not be fetched. Please try again."
    );

  } finally {

    button.disabled = false;
    loading.classList.add("hidden");

  }
}


function renderPNR(response) {

  /*
   * RailKit response:
   * response.success
   * response.data
   */

  const data = response?.data || response;

  const pnr =
    data?.pnr ||
    data?.pnrNumber ||
    data?.PNR ||
    input.value;

  const train =
    data?.train || {};

  const journey =
    data?.journey || {};

  const trainNumber =
    train?.number ||
    data?.trainNumber ||
    "-";

  const trainName =
    train?.name ||
    data?.trainName ||
    "-";

  const source =
    journey?.source?.name ||
    journey?.source?.code ||
    data?.source ||
    data?.from ||
    "-";

  const destination =
    journey?.destination?.name ||
    journey?.destination?.code ||
    data?.destination ||
    data?.to ||
    "-";

  const journeyDate =
    journey?.date ||
    data?.journeyDate ||
    "-";

  const travelClass =
    journey?.class ||
    data?.class ||
    "-";

  const quota =
    journey?.quota ||
    data?.quota ||
    "-";

  const fare =
    journey?.fare ||
    data?.fare ||
    "-";

  const passengers =
    Array.isArray(data?.passengers)
      ? data.passengers
      : [];


  setText("showPnr", pnr);

  setText(
    "trainInfo",
    `${trainNumber} ${trainName !== "-" ? "• " + trainName : ""}`
  );

  setText("fromStation", source);
  setText("toStation", destination);
  setText("journeyDate", journeyDate);
  setText("travelClass", travelClass);
  setText("quota", quota);
  setText("fare", fare);

  renderPassengers(passengers);

  const overall =
    getOverallStatus(passengers, data);

  const statusBox =
    document.getElementById("overallStatus");

  statusBox.textContent = overall;

  statusBox.className =
    "status-badge " + getStatusClass(overall);

  result.classList.remove("hidden");

  setTimeout(() => {
    result.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 100);
}


function renderPassengers(passengers) {

  const list =
    document.getElementById("passengerList");

  const count =
    document.getElementById("passengerCount");

  list.innerHTML = "";

  count.textContent =
    passengers.length
      ? `${passengers.length} Passenger${passengers.length > 1 ? "s" : ""}`
      : "No details";


  if (!passengers.length) {

    list.innerHTML = `
      <div class="passenger">
        <div>
          <strong>Passenger information unavailable</strong>
          <span>Please try again later.</span>
        </div>
      </div>
    `;

    return;
  }


  passengers.forEach((passenger, index) => {

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

    const statusClass =
      getStatusClass(current);


    const item =
      document.createElement("div");

    item.className = "passenger";

    item.innerHTML = `
      <div>
        <strong>${escapeHTML(name)}</strong>

        <span>
          Booking:
          ${escapeHTML(booking)}
        </span>

        ${
          coach !== "-"
            ? `<span>Coach: ${escapeHTML(coach)}</span>`
            : ""
        }

        ${
          berth !== "-"
            ? `<span>Berth: ${escapeHTML(berth)}</span>`
            : ""
        }
      </div>

      <div class="passenger-status ${statusClass}">
        ${escapeHTML(current)}
      </div>
    `;

    list.appendChild(item);

  });
}


function getOverallStatus(passengers, data) {

  if (data?.status) {
    return data.status;
  }

  if (!passengers.length) {
    return "Available";
  }

  const statuses =
    passengers.map(p =>
      String(
        p?.current?.status ||
        p?.currentStatus ||
        ""
      ).toUpperCase()
    );

  if (
    statuses.some(s =>
      s.includes("CNF") ||
      s.includes("CONFIRM")
    )
  ) {
    return "CNF";
  }

  if (
    statuses.some(s =>
      s.includes("RAC")
    )
  ) {
    return "RAC";
  }

  if (
    statuses.some(s =>
      s.includes("WL") ||
      s.includes("WAIT")
    )
  ) {
    return "WL";
  }

  return "Available";
}


function getStatusClass(status) {

  const value =
    String(status || "").toUpperCase();

  if (
    value.includes("CNF") ||
    value.includes("CONFIRM")
  ) {
    return "confirmed";
  }

  if (value.includes("RAC")) {
    return "rac";
  }

  if (
    value.includes("WL") ||
    value.includes("WAIT")
  ) {
    return "waiting";
  }

  return "";
}


function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value ?? "-";
  }
}


function showError(message) {

  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}


function escapeHTML(value) {

  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
