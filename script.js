document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("pnrForm");
  const input = document.getElementById("pnr");
  const button = document.getElementById("checkBtn");
  const result = document.getElementById("result");

  if (!form || !input || !button || !result) {
    console.error("AINEX: PNR elements missing");
    return;
  }

  form.addEventListener("submit", checkPNR);

  input.addEventListener("input", () => {
    input.value = input.value
      .replace(/\D/g, "")
      .slice(0, 10);
  });

  async function checkPNR(event) {

    event.preventDefault();

    const pnr = input.value.trim();

    if (!/^\d{10}$/.test(pnr)) {
      showError("Please enter a valid 10-digit PNR number.");
      return;
    }

    button.disabled = true;
    button.textContent = "⏳ Checking...";

    result.innerHTML = `
      <div class="loading">
        <div class="loader"></div>
        <strong>Checking PNR Status...</strong>
        <span>Please wait while we fetch the latest details.</span>
      </div>
    `;

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

      const raw = await response.text();

      let api;

      try {
        api = JSON.parse(raw);
      } catch {
        throw new Error(
          "Invalid response received from server."
        );
      }

      console.log("AINEX RailKit Response:", api);

      if (!response.ok || api?.success === false) {
        throw new Error(
          api?.message ||
          api?.error ||
          "PNR status could not be fetched."
        );
      }

      const data = api?.data || api;

      renderResult(data);

    } catch (error) {

      console.error("AINEX PNR Error:", error);

      showError(
        error?.message ||
        "Unable to check PNR status."
      );

    } finally {

      button.disabled = false;
      button.textContent = "🔎 Check Status";

    }
  }


  function renderResult(data) {

    const train = data?.train || {};
    const journey = data?.journey || {};
    const source = journey?.source || {};
    const destination = journey?.destination || {};
    const booking = data?.booking || {};

    const passengers = Array.isArray(data?.passengers)
      ? data.passengers
      : [];

    const status = getOverallStatus(passengers);

    result.innerHTML = `

      <div class="result-card">

        <div class="result-head">

          <div>

            <small>PNR RESULT</small>

            <h2>
              PNR ${safe(data?.pnr)}
            </h2>

            <p>
              ${safe(status.label)}
            </p>

          </div>

          <div class="status-badge ${status.class}">
            ${safe(status.code)}
          </div>

        </div>


        <div class="route">

          <div>

            <small>FROM</small>

            <b>
              ${station(source)}
            </b>

          </div>


          <div class="arrow">
            →
          </div>


          <div class="right">

            <small>TO</small>

            <b>
              ${station(destination)}
            </b>

          </div>

        </div>


        <div class="info-grid">

          <div>

            <small>TRAIN</small>

            <b>
              ${safe(train?.name)}
            </b>

          </div>


          <div>

            <small>TRAIN NUMBER</small>

            <b>
              ${safe(train?.number)}
            </b>

          </div>


          <div>

            <small>JOURNEY DATE</small>

            <b>
              ${safe(
                journey?.dateOfJourney ||
                journey?.date ||
                data?.journeyDate
              )}
            </b>

          </div>


          <div>

            <small>CLASS</small>

            <b>
              ${displayValue(journey?.class)}
            </b>

          </div>


          <div>

            <small>QUOTA</small>

            <b>
              ${displayValue(journey?.quota)}
            </b>

          </div>


          <div>

            <small>FARE</small>

            <b>
              ₹${displayValue(
                booking?.fare ||
                data?.fare
              )}
            </b>

          </div>

        </div>


        <h3 class="passenger-heading">
          Passenger Details
        </h3>


        <div class="passenger-list">

          ${
            passengers.length
              ? passengers
                  .map((passenger, index) =>
                    passengerHTML(passenger, index)
                  )
                  .join("")
              : `
                <div class="passenger">
                  <div>
                    <b>Passenger details unavailable</b>
                  </div>
                </div>
              `
          }

        </div>


        <div class="privacy">
        </div>

      </div>
    `;

    result.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }


  function passengerHTML(passenger, index) {

    const booking =
      passenger?.booking || {};

    const current =
      passenger?.current || {};

    const name =
      passenger?.name ||
      passenger?.passengerName ||
      `Passenger ${index + 1}`;

    const bookingStatus =
      displayValue(
        booking?.details ||
        booking?.status ||
        booking
      );

    const currentStatus =
      displayValue(
        current?.details ||
        current?.status ||
        current
      );

    const coach =
      displayValue(
        current?.coach ||
        current?.coachNumber ||
        booking?.coach ||
        booking?.coachNumber
      );

    const berth =
      displayValue(
        current?.berthNo ||
        current?.berthNumber ||
        current?.berth ||
        booking?.berthNo ||
        booking?.berth
      );

    const berthCode =
      displayValue(
        current?.berthCode ||
        current?.seat ||
        booking?.berthCode
      );

    const statusCode =
      getStatusCode(
        currentStatus !== "-"
          ? currentStatus
          : bookingStatus
      );

    return `

      <div class="passenger">

        <div class="passenger-top">

          <b>
            ${safe(name)}
          </b>

          <span class="${statusClass(statusCode)}">
            ${safe(statusCode || "STATUS")}
          </span>

        </div>


        <div class="passenger-info">

          <div>

            <small>BOOKING STATUS</small>

            <b>
              ${safe(bookingStatus)}
            </b>

          </div>


          <div>

            <small>CURRENT STATUS</small>

            <b>
              ${safe(currentStatus)}
            </b>

          </div>


          <div>

            <small>COACH</small>

            <b>
              ${safe(coach)}
            </b>

          </div>


          <div>

            <small>BERTH / SEAT</small>

            <b>
              ${safe(berth)}
              ${
                berthCode !== "-"
                  ? ` (${safe(berthCode)})`
                  : ""
              }
            </b>

          </div>

        </div>

      </div>
    `;
  }


  function station(value) {

    if (!value) return "-";

    if (typeof value === "string") {
      return safe(value);
    }

    const name =
      value?.name ||
      value?.stationName ||
      value?.station?.name;

    const code =
      value?.code ||
      value?.stationCode ||
      value?.station?.code;

    if (name) {

      return `
        ${safe(name)}
        ${code ? `<small>${safe(code)}</small>` : ""}
      `;

    }

    return displayValue(value);
  }


  function displayValue(value) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return safe(value);
    }

    if (Array.isArray(value)) {

      const values = value
        .map(item => plainValue(item))
        .filter(item => item !== "-");

      return safe(values.join(", ") || "-");
    }

    if (typeof value === "object") {

      const keys = [
        "details",
        "name",
        "status",
        "value",
        "text",
        "label",
        "code",
        "number",
        "description"
      ];

      for (const key of keys) {

        if (
          value[key] !== undefined &&
          value[key] !== null &&
          value[key] !== ""
        ) {

          const result =
            plainValue(value[key]);

          if (result !== "-") {
            return safe(result);
          }
        }
      }

      return "-";
    }

    return "-";
  }


  function plainValue(value) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return String(value);
    }

    if (Array.isArray(value)) {

      return value
        .map(item => plainValue(item))
        .filter(item => item !== "-")
        .join(", ") || "-";
    }

    if (typeof value === "object") {

      const keys = [
        "details",
        "name",
        "status",
        "value",
        "text",
        "label",
        "code",
        "number",
        "description"
      ];

      for (const key of keys) {

        if (
          value[key] !== undefined &&
          value[key] !== null &&
          value[key] !== ""
        ) {

          const output =
            plainValue(value[key]);

          if (output !== "-") {
            return output;
          }
        }
      }

      return "-";
    }

    return "-";
  }


  function getStatusCode(value) {

    const status =
      String(value || "").toUpperCase();

    if (status.includes("CNF"))
      return "CNF";

    if (status.includes("RAC"))
      return "RAC";

    if (status.includes("WL"))
      return "WL";

    if (
      status.includes("CAN") ||
      status.includes("CANCEL")
    )
      return "CAN";

    return "";
  }


  function statusClass(status) {

    if (status === "CNF")
      return "confirmed";

    if (status === "RAC")
      return "rac";

    if (status === "WL")
      return "waiting";

    if (status === "CAN")
      return "cancelled";

    return "unknown";
  }


  function getOverallStatus(passengers) {

    if (!passengers.length) {

      return {
        code: "—",
        label: "Status Available",
        class: "unknown"
      };

    }

    const statuses =
      passengers.map(passenger => {

        const current =
          plainValue(
            passenger?.current?.details ||
            passenger?.current?.status ||
            passenger?.current
          );

        const booking =
          plainValue(
            passenger?.booking?.details ||
            passenger?.booking?.status ||
            passenger?.booking
          );

        return getStatusCode(
          `${current} ${booking}`
        );

      });


    if (statuses.every(s => s === "CNF")) {

      return {
        code: "CNF",
        label: "Confirmed",
        class: "confirmed"
      };

    }


    if (statuses.includes("RAC")) {

      return {
        code: "RAC",
        label: "RAC Status",
        class: "rac"
      };

    }


    if (statuses.includes("WL")) {

      return {
        code: "WL",
        label: "Waiting List",
        class: "waiting"
      };

    }


    if (statuses.includes("CAN")) {

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


  function showError(message) {

    result.innerHTML = `
      <div class="error-box">

        <strong>
          Unable to fetch PNR
        </strong>

        <p>
          ${safe(message)}
        </p>

      </div>
    `;
  }


  function safe(value) {

    return String(value ?? "-")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

});
