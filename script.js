document.addEventListener("DOMContentLoaded", () => {

  const form = document.querySelector("#pnrForm");
  const input = document.querySelector("#pnr");
  const button = document.querySelector("#checkBtn");
  const result = document.querySelector("#result");

  if (!form || !input || !button || !result) {
    console.error("PNR HTML elements not found");
    return;
  }

  form.addEventListener("submit", checkPNR);

  async function checkPNR(e) {
    e.preventDefault();

    const pnr = input.value.trim();

    if (!/^\d{10}$/.test(pnr)) {
      result.innerHTML =
        `<div class="error-box">Please enter a valid 10-digit PNR.</div>`;
      return;
    }

    button.disabled = true;
    button.innerHTML = "⏳ Checking...";

    result.innerHTML = `
      <div class="loading">
        <b>Checking PNR Status...</b>
        <span>Please wait...</span>
      </div>
    `;

    try {

      const res = await fetch(
        "/api/pnr?pnr=" + encodeURIComponent(pnr),
        {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        }
      );

      const data = await res.json();

      console.log("PNR API RESPONSE:", data);

      if (!res.ok || data.success === false) {
        throw new Error(
          data.message ||
          data.error ||
          "PNR check failed."
        );
      }

      showResult(data.data || data);

    } catch (err) {

      console.error(err);

      result.innerHTML = `
        <div class="error-box">
          <b>Unable to check PNR</b>
          <p>${escapeHTML(err.message)}</p>
        </div>
      `;

    } finally {

      button.disabled = false;
      button.innerHTML = "🔎 Check Status";

    }
  }


  function showResult(d) {

    const train = d?.train || {};
    const journey = d?.journey || {};
    const source = journey?.source || {};
    const destination = journey?.destination || {};
    const passengers = Array.isArray(d?.passengers)
      ? d.passengers
      : [];

    result.innerHTML = `
      <div class="result-card">

        <div class="result-head">
          <small>PNR RESULT</small>
          <h2>PNR ${value(d?.pnr)}</h2>
          <strong>${overallStatus(passengers)}</strong>
        </div>

        <div class="route">
          <div>
            <small>FROM</small>
            <b>${location(source)}</b>
          </div>

          <span>→</span>

          <div class="right">
            <small>TO</small>
            <b>${location(destination)}</b>
          </div>
        </div>

        <div class="info-grid">

          <div>
            <small>TRAIN</small>
            <b>${value(train?.name)}</b>
          </div>

          <div>
            <small>TRAIN NUMBER</small>
            <b>${value(train?.number)}</b>
          </div>

          <div>
            <small>JOURNEY DATE</small>
            <b>${value(journey?.dateOfJourney)}</b>
          </div>

          <div>
            <small>CLASS</small>
            <b>${objectValue(journey?.class)}</b>
          </div>

          <div>
            <small>QUOTA</small>
            <b>${objectValue(journey?.quota)}</b>
          </div>

          <div>
            <small>FARE</small>
            <b>₹${objectValue(d?.booking?.fare || d?.fare)}</b>
          </div>

        </div>

        <h3 class="passenger-heading">
          Passenger Details
        </h3>

        <div class="passenger-list">
          ${
            passengers.length
              ? passengers.map(passenger).join("")
              : "<p>No passenger information available.</p>"
          }
        </div>

      </div>
    `;
  }


  function passenger(p, i) {

    const booking = p?.booking || {};
    const current = p?.current || {};

    const bookingText = objectValue(
      booking?.details ||
      booking?.status ||
      booking
    );

    const currentText = objectValue(
      current?.details ||
      current?.status ||
      current
    );

    const coach = objectValue(
      current?.coach ||
      current?.coachNumber ||
      booking?.coach ||
      booking?.coachNumber
    );

    const berth = objectValue(
      current?.berthNo ||
      current?.berth ||
      current?.berthNumber ||
      booking?.berthNo ||
      booking?.berth
    );

    const name =
      p?.name ||
      p?.passengerName ||
      `Passenger ${i + 1}`;

    return `
      <div class="passenger">

        <div class="passenger-top">
          <b>${value(name)}</b>
          <span>${status(currentText || bookingText)}</span>
        </div>

        <div class="passenger-info">

          <div>
            <small>BOOKING</small>
            <b>${bookingText}</b>
          </div>

          <div>
            <small>CURRENT</small>
            <b>${currentText}</b>
          </div>

          <div>
            <small>COACH</small>
            <b>${coach}</b>
          </div>

          <div>
            <small>BERTH / SEAT</small>
            <b>${berth}</b>
          </div>

        </div>

      </div>
    `;
  }


  function location(obj) {

    if (!obj) return "-";

    if (typeof obj === "string") {
      return escapeHTML(obj);
    }

    const name =
      obj.name ||
      obj.stationName ||
      obj.station?.name;

    const code =
      obj.code ||
      obj.stationCode ||
      obj.station?.code;

    if (name) {
      return escapeHTML(
        name + (code ? ` (${code})` : "")
      );
    }

    if (code) {
      return escapeHTML(code);
    }

    return objectValue(obj);
  }


  function objectValue(obj) {

    if (
      obj === null ||
      obj === undefined ||
      obj === ""
    ) return "-";

    if (
      typeof obj === "string" ||
      typeof obj === "number"
    ) {
      return escapeHTML(String(obj));
    }

    if (Array.isArray(obj)) {
      return obj
        .map(x => objectValue(x))
        .filter(x => x !== "-")
        .join(", ") || "-";
    }

    if (typeof obj === "object") {

      const keys = [
        "name",
        "details",
        "status",
        "value",
        "text",
        "label",
        "code",
        "number"
      ];

      for (const key of keys) {
        if (
          obj[key] !== undefined &&
          obj[key] !== null &&
          obj[key] !== ""
        ) {
          const v = objectValue(obj[key]);

          if (v !== "-") return v;
        }
      }

      return "-";
    }

    return "-";
  }


  function value(v) {
    return objectValue(v);
  }


  function status(text) {

    const s = String(text).toUpperCase();

    if (s.includes("CNF")) return "CNF";
    if (s.includes("RAC")) return "RAC";
    if (s.includes("WL")) return "WL";
    if (s.includes("CAN")) return "CAN";

    return "STATUS";
  }


  function overallStatus(list) {

    if (!list.length) return "Status Available";

    const statuses = list.map(p => {

      const c = objectValue(
        p?.current?.details ||
        p?.current?.status ||
        p?.current
      );

      const b = objectValue(
        p?.booking?.details ||
        p?.booking?.status ||
        p?.booking
      );

      return String(c + " " + b).toUpperCase();

    });

    if (statuses.some(x => x.includes("CNF")))
      return "Confirmed";

    if (statuses.some(x => x.includes("RAC")))
      return "RAC";

    if (statuses.some(x => x.includes("WL")))
      return "Waiting List";

    return "Status Available";
  }


  function escapeHTML(str) {

    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

});
