document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);

  /* =========================
     STATION DATA
  ========================= */

  const stations = [
    ["BV","Babhnan","Uttar Pradesh"],
    ["AYC","Ayodhya Cantt","Uttar Pradesh"],
    ["AY","Ayodhya Dham Jn","Uttar Pradesh"],
    ["GKP","Gorakhpur Jn","Uttar Pradesh"],
    ["BST","Basti","Uttar Pradesh"],
    ["LKO","Lucknow","Uttar Pradesh"],
    ["GD","Gonda Jn","Uttar Pradesh"],
    ["CPR","Chhapra Jn","Bihar"],
    ["LTT","Lokmanya Tilak Terminus","Maharashtra"],
    ["NDLS","New Delhi","Delhi"],
    ["ANVT","Anand Vihar Terminal","Delhi"],
    ["CNB","Kanpur Central","Uttar Pradesh"],
    ["BSB","Varanasi Jn","Uttar Pradesh"],
    ["PRYJ","Prayagraj Jn","Uttar Pradesh"],
    ["PNBE","Patna Jn","Bihar"],
    ["BJU","Barauni Jn","Bihar"],
    ["DLI","Delhi Jn","Delhi"],
    ["MUM","Mumbai Central","Maharashtra"]
  ];


  /* =========================
     DATE
  ========================= */

  const today = new Date();

  const todayValue =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2,"0") + "-" +
    String(today.getDate()).padStart(2,"0");


  [
    "liveDate",
    "seatDate",
    "fareDate",
    "searchDate",
    "historyDate"
  ].forEach(id => {

    const el = $(id);

    if (el && !el.value) {
      el.value = todayValue;
    }

  });


  /* =========================
     API
  ========================= */

  async function callAPI(params) {

    const query = new URLSearchParams(params);

    const response = await fetch(
      `/api/railway?${query.toString()}`,
      {
        method:"GET",
        headers:{
          "Accept":"application/json"
        },
        cache:"no-store"
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        "Server ne valid JSON response nahi diya."
      );
    }

    if (!response.ok || data?.success === false) {

      throw new Error(
        data?.message ||
        data?.error ||
        "Railway request failed."
      );

    }

    return data;
  }


  /* =========================
     HELPERS
  ========================= */

  function esc(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return "-";
    }

    return String(value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }


  function value(obj,...keys) {

    for (const key of keys) {

      const v = obj?.[key];

      if (
        v !== undefined &&
        v !== null &&
        v !== ""
      ) {
        return v;
      }

    }

    return "-";
  }


  function loading(text) {

    return `
      <div class="loading">
        <div class="loader"></div>
        <strong>${esc(text)}</strong>
      </div>
    `;

  }


  function error(message) {

    return `
      <div class="error-box">
        ❌ ${esc(message)}
      </div>
    `;

  }


  function show(box,html) {

    if (box) {
      box.innerHTML = html;
    }

  }


  /* =========================
     STATION AUTOCOMPLETE
  ========================= */

  function setupStationInput(inputId,suggestionId) {

    const input = $(inputId);
    const box = $(suggestionId);

    if (!input || !box) return;

    input.addEventListener("input",() => {

      const query =
        input.value.trim().toUpperCase();

      box.innerHTML = "";

      if (!query) {

        box.style.display = "none";
        return;

      }


      const matches = stations
        .filter(s =>
          s[0].includes(query) ||
          s[1].toUpperCase().includes(query)
        )
        .slice(0,7);


      if (!matches.length) {

        box.style.display = "none";
        return;

      }


      matches.forEach(s => {

        const item =
          document.createElement("div");

        item.className =
          "station-suggestion";

        item.innerHTML = `
          <div class="station-suggestion-icon">
            🚉
          </div>

          <div>
            <strong>${esc(s[1])}</strong>
            <span>${esc(s[0])} • ${esc(s[2])}</span>
          </div>
        `;


        item.addEventListener("click",() => {

          input.value =
            `${s[1]} (${s[0]})`;

          input.dataset.code = s[0];

          box.innerHTML = "";
          box.style.display = "none";

        });


        box.appendChild(item);

      });


      box.style.display = "block";

    });


    input.addEventListener("keydown",e => {

      if (e.key === "Escape") {

        box.innerHTML = "";
        box.style.display = "none";

      }

    });

  }


  [
    ["fromStation","fromSuggestions"],
    ["toStation","toSuggestions"],
    ["seatFrom","seatFromSuggestions"],
    ["seatTo","seatToSuggestions"],
    ["fareFrom","fareFromSuggestions"],
    ["fareTo","fareToSuggestions"],
    ["stationCode","stationSuggestions"]
  ].forEach(item => {

    setupStationInput(
      item[0],
      item[1]
    );

  });


  function getStationCode(inputId) {

    const input = $(inputId);

    if (!input) return "";

    if (input.dataset.code) {
      return input.dataset.code;
    }

    const text =
      input.value.trim().toUpperCase();

    const match =
      stations.find(s =>
        s[0] === text
      );

    if (match) return match[0];

    const codeMatch =
      text.match(/\(([A-Z]{2,5})\)/);

    if (codeMatch) {
      return codeMatch[1];
    }

    return text;

  }


  /* =========================
     PNR
  ========================= */

  $("pnrForm")?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const pnr =
        $("pnr").value
        .replace(/\D/g,"")
        .slice(0,10);

      const box = $("result");
      const btn = $("checkBtn");

      if (!/^\d{10}$/.test(pnr)) {

        show(
          box,
          error("Please enter valid 10 digit PNR.")
        );

        return;

      }


      btn.disabled = true;
      btn.textContent = "⏳ CHECKING...";

      show(
        box,
        loading("Checking PNR status...")
      );


      try {

        const result =
          await callAPI({
            action:"pnr",
            pnr
          });

        renderPNR(
          result?.data || result
        );

      } catch(err) {

        show(
          box,
          error(err.message)
        );

      }


      btn.disabled = false;
      btn.textContent =
        "🔎 CHECK PNR STATUS";

    }
  );


  /* =========================
     PNR RESULT
  ========================= */

  function renderPNR(d) {

    const train = d?.train || {};
    const journey = d?.journey || {};

    const source =
      journey?.source || {};

    const destination =
      journey?.destination || {};

    const passengers =
      Array.isArray(d?.passengers)
        ? d.passengers
        : [];


    const passengersHTML =
      passengers.map((p,i) => {

        const booking =
          p?.booking || {};

        const current =
          p?.current || {};


        const status =
          value(
            current,
            "details",
            "status"
          );


        return `
          <div class="passenger">

            <div class="passenger-top">

              <b>
                Passenger ${i + 1}
              </b>

              <span class="unknown">
                ${esc(status)}
              </span>

            </div>


            <div class="passenger-info">

              <div>
                <small>BOOKING STATUS</small>
                <b>
                  ${esc(
                    value(
                      booking,
                      "details",
                      "status"
                    )
                  )}
                </b>
              </div>


              <div>
                <small>CURRENT STATUS</small>
                <b>
                  ${esc(status)}
                </b>
              </div>


              <div>
                <small>COACH</small>
                <b>
                  ${esc(
                    value(
                      current,
                      "coach",
                      "coachNumber"
                    )
                  )}
                </b>
              </div>


              <div>
                <small>SEAT / BERTH</small>
                <b>
                  ${esc(
                    value(
                      current,
                      "berthNo",
                      "berth"
                    )
                  )}
                </b>
              </div>

            </div>

          </div>
        `;

      }).join("");


    show(
      $("result"),
      `
        <div class="result-card">

          <div class="result-head">

            <small>PNR RESULT</small>

            <h2>
              PNR ${esc(d?.pnr)}
            </h2>

            <p>
              ${esc(
                value(
                  d,
                  "status",
                  "message"
                )
              )}
            </p>

          </div>


          <div class="route">

            <div>

              <small>FROM</small>

              <b>
                ${esc(
                  value(
                    source,
                    "name",
                    "stationName",
                    "code"
                  )
                )}
              </b>

            </div>


            <div class="arrow">
              →
            </div>


            <div class="right">

              <small>TO</small>

              <b>
                ${esc(
                  value(
                    destination,
                    "name",
                    "stationName",
                    "code"
                  )
                )}
              </b>

            </div>

          </div>


          <div class="info-grid">

            <div>
              <small>TRAIN</small>
              <b>
                ${esc(
                  value(
                    train,
                    "name",
                    "trainName"
                  )
                )}
              </b>
            </div>


            <div>
              <small>TRAIN NUMBER</small>
              <b>
                ${esc(
                  value(
                    train,
                    "number",
                    "trainNumber",
                    "trainNo"
                  )
                )}
              </b>
            </div>


            <div>
              <small>JOURNEY DATE</small>
              <b>
                ${esc(
                  value(
                    journey,
                    "date",
                    "dateOfJourney"
                  )
                )}
              </b>
            </div>


            <div>
              <small>CLASS</small>
              <b>
                ${esc(
                  value(
                    journey,
                    "class"
                  )
                )}
              </b>
            </div>


          </div>


          ${
            passengers.length
              ? `
                <h3 class="passenger-heading">
                  Passenger Details
                </h3>

                <div class="passenger-list">
                  ${passengersHTML}
                </div>
              `
              : ""
          }


          <div class="privacy">
            🔒 Railway information fetched securely.
          </div>

        </div>
      `
    );

  }


  /* =========================
     LIVE TRAIN
  ========================= */

  $("liveForm")?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const trainNo =
        $("liveTrain").value.trim();

      const date =
        $("liveDate").value;

      const box =
        $("liveResult");


      if (!/^\d{5}$/.test(trainNo)) {

        show(
          box,
          error("Enter valid 5 digit train number.")
        );

        return;

      }


      show(
        box,
        loading("Fetching live train status...")
      );


      try {

        const result =
          await callAPI({
            action:"live",
            trainNo,
            date
          });


        const d =
          result?.data || result;


        renderLiveTrain(
          box,
          d,
          trainNo
        );


      } catch(err) {

        show(
          box,
          error(err.message)
        );

      }

    }
  );


  function renderLiveTrain(box,d,trainNo) {

    const timeline =
      Array.isArray(d?.timeline)
        ? d.timeline
        : Array.isArray(d?.stations)
        ? d.stations
        : [];


    show(
      box,
      `
        <div class="data-box">

          <h3>🚆 Live Train Status</h3>

          <p>
            <b>Train:</b>
            ${esc(
              value(
                d,
                "trainName",
                "name"
              )
            )}
          </p>

          <p>
            <b>Train Number:</b>
            ${esc(
              value(
                d,
                "trainNo",
                "trainNumber"
              ) !== "-"
                ? value(d,"trainNo","trainNumber")
                : trainNo
            )}
          </p>

          <p>
            <b>Status:</b>
            ${esc(
              value(
                d,
                "statusNote",
                "status",
                "message"
              )
            )}
          </p>


          ${
            timeline.length
              ? `
                <h4>Station Updates</h4>

                <div class="train-list">

                  ${timeline.map(t => `

                    <div class="train-item">

                      <strong>
                        🚉 ${esc(
                          value(
                            t,
                            "stationName",
                            "name",
                            "station"
                          )
                        )}
                      </strong>

                      <p>
                        Arrival:
                        ${esc(
                          value(
                            t?.arrival || {},
                            "actual",
                            "scheduled",
                            "time"
                          )
                        )}
                      </p>

                      <p>
                        Departure:
                        ${esc(
                          value(
                            t?.departure || {},
                            "actual",
                            "scheduled",
                            "time"
                          )
                        )}
                      </p>

                    </div>

                  `).join("")}

                </div>
              `
              : ""
          }

        </div>
      `
    );

  }


  /* =========================
     TRAIN SEARCH
  ========================= */

  $("searchForm")?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const from =
        getStationCode("fromStation");

      const to =
        getStationCode("toStation");

      const date =
        $("searchDate").value;

      const box =
        $("searchResult");


      if (!from || !to) {

        show(
          box,
          error("From aur To station select karein.")
        );

        return;

      }


      show(
        box,
        loading("Searching trains...")
      );


      try {

        const result =
          await callAPI({
            action:"search",
            from,
            to
          });


        renderTrainSearch(
          box,
          result?.data || result
        );


      } catch(err) {

        show(
          box,
          error(err.message)
        );

      }

    }
  );


  function renderTrainSearch(box,d) {

    const trains =
      Array.isArray(d)
        ? d
        : Array.isArray(d?.trains)
        ? d.trains
        : [];


    if (!trains.length) {

      show(
        box,
        `
          <div class="data-box">
            <h3>🔎 Train Search</h3>
            <p>No train data available.</p>
          </div>
        `
      );

      return;

    }


    show(
      box,
      `
        <div class="data-box">

          <h3>
            🚆 ${trains.length} Trains Found
          </h3>

          <div class="train-list">

            ${trains.map(t => `

              <div class="train-item">

                <strong>
                  ${esc(
                    value(
                      t,
                      "trainNo",
                      "trainNumber",
                      "number"
                    )
                  )}
                  —
                  ${esc(
                    value(
                      t,
                      "trainName",
                      "name"
                    )
                  )}
                </strong>


                <p>
                  🟢 Departure:
                  ${esc(
                    value(
                      t,
                      "departure",
                      "departureTime"
                    )
                  )}
                </p>


                <p>
                  🔴 Arrival:
                  ${esc(
                    value(
                      t,
                      "arrival",
                      "arrivalTime"
                    )
                  )}
                </p>


                <p>
                  📅 Running:
                  ${esc(
                    value(
                      t,
                      "runningDays",
                      "running_days"
                    )
                  )}
                </p>

              </div>

            `).join("")}

          </div>

        </div>
      `
    );

  }


  /* =========================
     LIVE STATION
  ========================= */

  $("stationForm")?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const station =
        getStationCode("stationCode");

      const hours =
        $("stationHours").value;

      const box =
        $("stationResult");


      if (!station) {

        show(
          box,
          error("Station select karein.")
        );

        return;

      }


      show(
        box,
        loading("Fetching station trains...")
      );


      try {

        const result =
          await callAPI({
            action:"station",
            station,
            hours
          });


        renderStation(
          box,
          result?.data || result,
          station
        );


      } catch(err) {

        show(
          box,
          error(err.message)
        );

      }

    }
  );


  function renderStation(box,d,station) {

    const trains =
      Array.isArray(d?.trains)
        ? d.trains
        : [];


    show(
      box,
      `
        <div class="data-box">

          <h3>
            🚉 ${esc(station)} Live Station
          </h3>

          <p>
            <b>
              ${trains.length}
            </b>
            trains found
          </p>


          ${
            trains.length
              ? `
                <div class="train-list">

                  ${trains.map(t => `

                    <div class="train-item">

                      <strong>
                        🚆
                        ${esc(
                          value(
                            t,
                            "trainNo",
                            "trainNumber"
                          )
                        )}
                        —
                        ${esc(
                          value(
                            t,
                            "trainName",
                            "name"
                          )
                        )}
                      </strong>


                      <p>
                        ${esc(
                          value(
                            t,
                            "sourceName",
                            "source"
                          )
                        )}
                        →
                        ${esc(
                          value(
                            t,
                            "destName",
                            "destination"
                          )
                        )}
                      </p>


                      <p>
                        🕐 Arrival:
                        ${esc(
                          value(
                            t?.arrival || {},
                            "actual",
                            "scheduled",
                            "time"
                          )
                        )}
                      </p>


                      <p>
                        🚉 Platform:
                        ${esc(
                          value(
                            t,
                            "platform",
                            "platformNumber"
                          )
                        )}
                      </p>


                      <p>
                        ⏱️ Delay:
                        ${esc(
                          value(
                            t?.arrival || {},
                            "delay",
                            "delayMinutes"
                          )
                        )}
                      </p>

                    </div>

                  `).join("")}

                </div>
              `
              : `
                <p>
                  Train details available nahi hain.
                </p>
              `
          }

        </div>
      `
    );

  }


  /* =========================
     SEAT AVAILABILITY
  ========================= */

  $("seatForm")?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const trainNo =
        $("seatTrain").value.trim();

      const from =
        getStationCode("seatFrom");

      const to =
        getStationCode("seatTo");

      const date =
        $("seatDate").value;

      const coach =
        $("seatClass").value;

      const quota =
        $("seatQuota").value;

      const box =
        $("seatResult");


      if (
        !/^\d{5}$/.test(trainNo) ||
        !from ||
        !to ||
        !date
      ) {

        show(
          box,
          error(
            "Train, From, To aur Date required hai."
          )
        );

        return;

      }


      show(
        box,
        loading("Checking seat availability...")
      );


      try {

        const result =
          await callAPI({
            action:"seats",
            trainNo,
            from,
            to,
            date,
            coach,
            quota
          });


        renderSeats(
          box,
          result?.data || result
        );


      } catch(err) {

        show(
          box,
          error(err.message)
        );

      }

    }
  );


  function renderSeats(box,d) {

    const list =
      Array.isArray(d?.availability)
        ? d.availability
        : Array.isArray(d)
        ? d
        : [];


    show(
      box,
      `
        <div class="data-box">

          <h3>💺 Seat Availability</h3>

          <p>
            <b>Train:</b>
            ${esc(
              value(
                d,
                "trainName",
                "train"
              )
            )}
          </p>


          ${
            list.length
              ? `
                <div class="availability-list">

                  ${list.map(a => `

                    <div class="availability-item">

                      <strong>
                        ${esc(
                          value(
                            a,
                            "date",
                            "journeyDate"
                          )
                        )}
                      </strong>

                      <span>
                        ${esc(
                          value(
                            a,
                            "status",
                            "availability"
                          )
                        )}
                      </span>

                      <small>
                        ${
                          value(a,"fare") !== "-"
                            ? "₹" +
                              esc(
                                value(
                                  a,
                                  "fare"
                                )
                              )
                            : ""
                        }
                      </small>

                    </div>

                  `).join("")}

                </div>
              `
              : `
                <p>
                  <b>Availability:</b>
                  ${esc(
                    value(
                      d,
                      "availability",
                      "status"
                    )
                  )}
                </p>
              `
          }

        </div>
      `
    );

  }


  /* =========================
     FARE
  ========================= */

  $("fareForm")?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const trainNo =
        $("fareTrain").value.trim();

      const from =
        getStationCode("fareFrom");

      const to =
        getStationCode("fareTo");

      const date =
        $("fareDate").value;

      const travelClass =
        $("fareClass").value;

      const quota =
        $("fareQuota").value;

      const box =
        $("fareResult");


      if (
        !/^\d{5}$/.test(trainNo) ||
        !from ||
        !to ||
        !date
      ) {

        show(
          box,
          error(
            "Train, From, To aur Date required hai."
          )
        );

        return;

      }


      show(
        box,
        loading("Checking fare...")
      );


      try {

        const result =
          await callAPI({
            action:"fare",
            trainNo,
            from,
            to,
            date,
            travelClass,
            quota
          });


        renderFare(
          box,
          result?.data || result
        );


      } catch(err) {

        show(
          box,
          error(err.message)
        );

      }

    }
  );


  function renderFare(box,d) {

    const total =
      value(
        d,
        "totalFare",
        "total",
        "fare"
      );


    show(
      box,
      `
        <div class="data-box">

          <h3>💰 Fare Details</h3>

          <p>
            <b>Base Fare:</b>
            ₹${esc(
              value(
                d,
                "baseFare",
                "base"
              )
            )}
          </p>

          <p>
            <b>Reservation:</b>
            ₹${esc(
              value(
                d,
                "reservation",
                "reservationCharge"
              )
            )}
          </p>

          <p>
            <b>Superfast:</b>
            ₹${esc(
              value(
                d,
                "superfast",
                "superfastCharge"
              )
            )}
          </p>

          <p>
            <b>GST:</b>
            ₹${esc(
              value(
                d,
                "gst",
                "gstAmount"
              )
            )}
          </p>

          <hr>

          <h2>
            Total Fare:
            ₹${esc(total)}
          </h2>

        </div>
      `
    );

  }


  /* =========================
     TRAIN INFORMATION
  ========================= */

  $("trainForm")?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const trainNo =
        $("trainInfoNo").value.trim();

      const box =
        $("trainResult");


      if (!/^\d{5}$/.test(trainNo)) {

        show(
          box,
          error("Enter valid 5 digit train number.")
        );

        return;

      }


      show(
        box,
        loading("Fetching train information...")
      );


      try {

        const result =
          await callAPI({
            action:"train",
            trainNo
          });


        renderGeneric(
          box,
          result?.data || result,
          "🗺️ Train Information"
        );


      } catch(err) {

        show(
          box,
          error(err.message)
        );

      }

    }
  );


  /* =========================
     HISTORY
  ========================= */

  $("historyForm")?.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const trainNo =
        $("historyTrain").value.trim();

      const date =
        $("historyDate").value;

      const box =
        $("historyResult");


      if (
        !/^\d{5}$/.test(trainNo) ||
        !date
      ) {

        show(
          box,
          error(
            "Train number aur date required hai."
          )
        );

        return;

      }


      show(
        box,
        loading("Fetching train history...")
      );


      try {

        const result =
          await callAPI({
            action:"history",
            trainNo,
            date
          });


        renderGeneric(
          box,
          result?.data || result,
          "📜 Train History"
        );


      } catch(err) {

        show(
          box,
          error(err.message)
        );

      }

    }
  );


  /* =========================
     GENERIC RESULT
  ========================= */

  function renderGeneric(box,d,title) {

    if (!d) {

      show(
        box,
        `
          <div class="data-box">
            <h3>${esc(title)}</h3>
            <p>No data available.</p>
          </div>
        `
      );

      return;

    }


    let html = "";


    if (Array.isArray(d)) {

      html = d.slice(0,30).map(item => {

        if (typeof item === "object") {

          return `
            <div class="train-item">
              ${objectHTML(item)}
            </div>
          `;

        }

        return `
          <p>• ${esc(item)}</p>
        `;

      }).join("");

    }


    else if (typeof d === "object") {

      html =
        Object.entries(d)
          .slice(0,40)
          .map(([key,val]) => {

            if (
              val &&
              typeof val === "object"
            ) {

              return `
                <div class="train-item">

                  <strong>
                    ${esc(formatKey(key))}
                  </strong>

                  ${objectHTML(val)}

                </div>
              `;

            }

            return `
              <p>
                <b>${esc(formatKey(key))}:</b>
                ${esc(val)}
              </p>
            `;

          }).join("");

    }


    else {

      html =
        `<p>${esc(d)}</p>`;

    }


    show(
      box,
      `
        <div class="data-box">

          <h3>${esc(title)}</h3>

          ${html}

        </div>
      `
    );

  }


  function objectHTML(obj) {

    return Object.entries(obj)
      .slice(0,20)
      .map(([k,v]) => {

        if (
          v &&
          typeof v === "object"
        ) {

          return `
            <p>
              <b>${esc(formatKey(k))}:</b>
              ${esc(
                JSON.stringify(v)
              )}
            </p>
          `;

        }

        return `
          <p>
            <b>${esc(formatKey(k))}:</b>
            ${esc(v)}
          </p>
        `;

      }).join("");

  }


  function formatKey(key) {

    return String(key)
      .replace(/([A-Z])/g," $1")
      .replace(/[_-]/g," ")
      .replace(/^./,x => x.toUpperCase());

  }


  /* =========================
     CANCELLED TRAINS
  ========================= */

  $("cancelledBtn")?.addEventListener(
    "click",
    async () => {

      const box =
        $("cancelledResult");


      show(
        box,
        loading("Fetching cancelled trains...")
      );


      try {

        const result =
          await callAPI({
            action:"cancelled"
          });


        renderGeneric(
          box,
          result?.data || result,
          "❌ Cancelled Trains"
        );


      } catch(err) {

        show(
          box,
          error(err.message)
        );

      }

    }
  );


});
