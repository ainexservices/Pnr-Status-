document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);

  /* =========================
     PNR STATUS
  ========================= */

  const pnrForm = $("pnrForm");
  const pnrInput = $("pnr");
  const checkBtn = $("checkBtn");
  const result = $("result");

  if (pnrForm) {

    pnrForm.addEventListener("submit", async e => {

      e.preventDefault();

      const pnr = pnrInput.value.replace(/\D/g, "");

      if (!/^\d{10}$/.test(pnr)) {
        result.innerHTML =
          errorHTML("Please enter a valid 10-digit PNR number.");
        return;
      }

      loading(result, "Checking PNR Status...");

      checkBtn.disabled = true;
      checkBtn.textContent = "⏳ Checking...";

      try {

        const data = await api(
          `/api/pnr?pnr=${encodeURIComponent(pnr)}`
        );

        renderPNR(data.data || data);

      } catch (err) {

        result.innerHTML = errorHTML(err.message);

      } finally {

        checkBtn.disabled = false;
        checkBtn.textContent = "🔎 CHECK STATUS";

      }

    });

    pnrInput.addEventListener("input", () => {
      pnrInput.value =
        pnrInput.value.replace(/\D/g, "").slice(0, 10);
    });

  }


  /* =========================
     LIVE TRAIN
  ========================= */

  $("liveBtn")?.addEventListener("click", async () => {

    const train = $("liveTrain").value.trim();
    const date = $("liveDate").value;
    const box = $("liveResult");

    if (!/^\d{5}$/.test(train)) {
      box.innerHTML =
        errorHTML("Enter a valid 5-digit train number.");
      return;
    }

    loading(box, "Fetching live train status...");

    try {

      const data = await api(
        `/api/rail?action=live&train=${encodeURIComponent(train)}&date=${encodeURIComponent(date)}`
      );

      renderLive(box, data.data || data);

    } catch (err) {

      box.innerHTML = errorHTML(err.message);

    }

  });


  /* =========================
     SEAT AVAILABILITY
  ========================= */

  $("seatBtn")?.addEventListener("click", async () => {

    const train = $("seatTrain").value.trim();
    const from = $("seatFrom").value.trim().toUpperCase();
    const to = $("seatTo").value.trim().toUpperCase();
    const date = $("seatDate").value;
    const coach = $("seatClass").value;
    const quota = $("seatQuota").value;
    const box = $("seatResult");

    if (
      !/^\d{5}$/.test(train) ||
      !from ||
      !to ||
      !date
    ) {
      box.innerHTML =
        errorHTML("Train, From, To and Date are required.");
      return;
    }

    loading(box, "Checking seat availability...");

    try {

      const params = new URLSearchParams({
        action: "availability",
        train,
        from,
        to,
        date,
        coach,
        quota
      });

      const data = await api(
        `/api/rail?${params.toString()}`
      );

      renderGeneric(box, data.data || data, "Seat Availability");

    } catch (err) {

      box.innerHTML = errorHTML(err.message);

    }

  });


  /* =========================
     FARE
  ========================= */

  $("fareBtn")?.addEventListener("click", async () => {

    const train = $("fareTrain").value.trim();
    const from = $("fareFrom").value.trim().toUpperCase();
    const to = $("fareTo").value.trim().toUpperCase();
    const date = $("fareDate").value;
    const coach = $("fareClass").value;
    const quota = $("fareQuota").value;
    const box = $("fareResult");

    if (
      !/^\d{5}$/.test(train) ||
      !from ||
      !to ||
      !date
    ) {
      box.innerHTML =
        errorHTML("Train, From, To and Date are required.");
      return;
    }

    loading(box, "Checking fare...");

    try {

      const params = new URLSearchParams({
        action: "fare",
        train,
        from,
        to,
        date,
        coach,
        quota
      });

      const data = await api(
        `/api/rail?${params.toString()}`
      );

      renderGeneric(box, data.data || data, "Fare Details");

    } catch (err) {

      box.innerHTML = errorHTML(err.message);

    }

  });


  /* =========================
     LIVE STATION
  ========================= */

  $("stationBtn")?.addEventListener("click", async () => {

    const station =
      $("stationCode").value.trim().toUpperCase();

    const box = $("stationResult");

    if (!/^[A-Z]{2,5}$/.test(station)) {
      box.innerHTML =
        errorHTML("Enter a valid station code.");
      return;
    }

    loading(box, "Fetching station information...");

    try {

      const params = new URLSearchParams({
        action: "station",
        station
      });

      const data = await api(
        `/api/rail?${params.toString()}`
      );

      renderGeneric(
        box,
        data.data || data,
        "Live Station"
      );

    } catch (err) {

      box.innerHTML = errorHTML(err.message);

    }

  });


  /* =========================
     TRAIN BETWEEN STATIONS
  ========================= */

  $("searchBtn")?.addEventListener("click", async () => {

    const from =
      $("searchFrom").value.trim().toUpperCase();

    const to =
      $("searchTo").value.trim().toUpperCase();

    const box = $("searchResult");

    if (!from || !to) {
      box.innerHTML =
        errorHTML("From and To station codes are required.");
      return;
    }

    loading(box, "Searching trains...");

    try {

      const params = new URLSearchParams({
        action: "search",
        from,
        to
      });

      const data = await api(
        `/api/rail?${params.toString()}`
      );

      renderGeneric(
        box,
        data.data || data,
        "Available Trains"
      );

    } catch (err) {

      box.innerHTML = errorHTML(err.message);

    }

  });


  /* =========================
     API HELPER
  ========================= */

  async function api(url) {

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        "Server returned an invalid response."
      );
    }

    if (!response.ok || data?.success === false) {

      throw new Error(
        data?.message ||
        data?.error ||
        "Railway service request failed."
      );

    }

    return data;
  }


  /* =========================
     PNR RESULT
  ========================= */

  function renderPNR(d) {

    const train = d?.train || {};
    const journey = d?.journey || {};
    const source = journey?.source || {};
    const destination = journey?.destination || {};
    const booking = d?.booking || {};

    const passengers =
      Array.isArray(d?.passengers)
        ? d.passengers
        : [];

    result.innerHTML = `

      <div class="result-card">

        <div class="result-head">

          <small>PNR RESULT</small>

          <h2>
            PNR ${safe(d?.pnr)}
          </h2>

          <p>
            ${safe(getPNRStatus(passengers))}
          </p>

        </div>


        <div class="route">

          <div>
            <small>FROM</small>
            <b>${station(source)}</b>
          </div>

          <div class="arrow">→</div>

          <div class="right">
            <small>TO</small>
            <b>${station(destination)}</b>
          </div>

        </div>


        <div class="info-grid">

          <div>
            <small>TRAIN</small>
            <b>${safe(train?.name)}</b>
          </div>

          <div>
            <small>TRAIN NUMBER</small>
            <b>${safe(train?.number)}</b>
          </div>

          <div>
            <small>JOURNEY DATE</small>
            <b>${safe(
              journey?.dateOfJourney ||
              journey?.date
            )}</b>
          </div>

          <div>
            <small>CLASS</small>
            <b>${display(
              journey?.class
            )}</b>
          </div>

          <div>
            <small>QUOTA</small>
            <b>${display(
              journey?.quota
            )}</b>
          </div>

          <div>
            <small>FARE</small>
            <b>₹${display(
              booking?.fare ||
              d?.fare
            )}</b>
          </div>

        </div>


        <h3 class="passenger-heading">
          Passenger Details
        </h3>


        <div class="passenger-list">

          ${
            passengers.length
              ? passengers
                  .map(passengerHTML)
                  .join("")
              : `
                <div class="passenger">
                  Passenger details unavailable.
                </div>
              `
          }

        </div>


        <div class="privacy">
          🔒 PNR status fetched successfully.
        </div>

      </div>
    `;
  }


  function passengerHTML(p, index) {

    const booking = p?.booking || {};
    const current = p?.current || {};

    const bookingStatus =
      display(
        booking?.details ||
        booking?.status ||
        booking
      );

    const currentStatus =
      display(
        current?.details ||
        current?.status ||
        current
      );

    const code =
      getStatusCode(
        currentStatus + " " + bookingStatus
      );

    return `

      <div class="passenger">

        <div class="passenger-top">

          <b>
            Passenger ${index + 1}
          </b>

          <span class="${statusClass(code)}">
            ${safe(code || "STATUS")}
          </span>

        </div>


        <div class="passenger-info">

          <div>
            <small>BOOKING STATUS</small>
            <b>${safe(bookingStatus)}</b>
          </div>

          <div>
            <small>CURRENT STATUS</small>
            <b>${safe(currentStatus)}</b>
          </div>

          <div>
            <small>COACH</small>
            <b>${display(
              current?.coach ||
              current?.coachNumber ||
              booking?.coach
            )}</b>
          </div>

          <div>
            <small>BERTH / SEAT</small>
            <b>${display(
              current?.berthNo ||
              current?.berth ||
              booking?.berthNo
            )}</b>
          </div>

        </div>

      </div>
    `;
  }


  /* =========================
     LIVE TRAIN RESULT
  ========================= */

  function renderLive(box, d) {

    const train = d?.train || d || {};

    box.innerHTML = `
      <div class="service-result-card">

        <strong>
          🚆 ${display(train?.name || d?.trainName)}
        </strong>

        <p>
          Train Number:
          ${display(train?.number || d?.trainNumber)}
        </p>

        <p>
          Current Location:
          ${display(
            d?.currentStation ||
            d?.currentLocation ||
            d?.location
          )}
        </p>

        <p>
          Delay:
          ${display(
            d?.delay ||
            d?.delayMinutes
          )}
        </p>

      </div>
    `;
  }


  /* =========================
     GENERIC RESULT
  ========================= */

  function renderGeneric(box, data, title) {

    const html =
      formatObject(data);

    box.innerHTML = `
      <div class="service-result-card">

        <strong>
          ${safe(title)}
        </strong>

        ${html}

      </div>
    `;
  }


  function formatObject(data) {

    if (
      data === null ||
      data === undefined
    ) {
      return "<p>No data available.</p>";
    }

    if (
      typeof data === "string" ||
      typeof data === "number"
    ) {
      return `<p>${safe(data)}</p>`;
    }

    if (Array.isArray(data)) {

      return data
        .slice(0, 20)
        .map(item =>
          `<p>• ${safe(display(item))}</p>`
        )
        .join("");
    }

    if (typeof data === "object") {

      return Object.entries(data)
        .slice(0, 30)
        .map(([key, value]) => {

          return `
            <p>
              <b>${safe(formatKey(key))}:</b>
              ${safe(display(value))}
            </p>
          `;

        })
        .join("");
    }

    return "<p>No data available.</p>";
  }


  /* =========================
     HELPERS
  ========================= */

  function station(obj) {

    if (!obj) return "-";

    if (typeof obj === "string") {
      return safe(obj);
    }

    const name =
      obj?.name ||
      obj?.stationName ||
      obj?.station?.name;

    const code =
      obj?.code ||
      obj?.stationCode ||
      obj?.station?.code;

    if (name) {

      return `
        ${safe(name)}
        ${code ? `<small>${safe(code)}</small>` : ""}
      `;

    }

    return display(obj);
  }


  function display(value) {

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
        .map(display)
        .filter(v => v !== "-")
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

          const v = display(value[key]);

          if (v !== "-") {
            return v;
          }

        }

      }

      return "-";
    }

    return "-";
  }


  function getPNRStatus(passengers) {

    const values =
      passengers.map(p =>
        display(
          p?.current?.details ||
          p?.current?.status ||
          p?.current ||
          p?.booking
        ).toUpperCase()
      );

    if (values.some(v => v.includes("CNF")))
      return "Confirmed";

    if (values.some(v => v.includes("RAC")))
      return "RAC";

    if (values.some(v => v.includes("WL")))
      return "Waiting List";

    if (values.some(v => v.includes("CAN")))
      return "Cancelled";

    return "Status Available";
  }


  function getStatusCode(value) {

    const s =
      String(value || "").toUpperCase();

    if (s.includes("CNF"))
      return "CNF";

    if (s.includes("RAC"))
      return "RAC";

    if (s.includes("WL"))
      return "WL";

    if (s.includes("CAN"))
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


  function loading(box, message) {

    box.innerHTML = `
      <div class="service-loading">
        ⏳ ${safe(message)}
      </div>
    `;
  }


  function errorHTML(message) {

    return `
      <div class="service-error">
        ❌ ${safe(message)}
      </div>
    `;
  }


  function formatKey(key) {

    return String(key)
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/^./, s => s.toUpperCase());
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
