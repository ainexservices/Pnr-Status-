document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);

  /* =========================
     STATIONS
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
    ["MUM","Mumbai Central","Maharashtra"],
    ["BDTS","Bandra Terminus","Maharashtra"],
    ["NDLS","New Delhi","Delhi"],
    ["SBC","KSR Bengaluru","Karnataka"],
    ["MAS","Chennai Central","Tamil Nadu"],
    ["HWH","Howrah Jn","West Bengal"],
    ["RNC","Ranchi","Jharkhand"]
  ];

  /* =========================
     DATE
  ========================= */

  const now = new Date();

  const today =
    now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");

  [
    "liveDate",
    "seatDate",
    "fareDate",
    "searchDate",
    "historyDate"
  ].forEach(id => {
    if ($(id) && !$(id).value) {
      $(id).value = today;
    }
  });

  /* =========================
     HELPERS
  ========================= */

  function esc(v) {
    if (v === undefined || v === null || v === "") {
      return "-";
    }

    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function pick(obj, keys, fallback = "-") {
    if (!obj) return fallback;

    for (const key of keys) {
      const value = obj[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return fallback;
  }

  function loading(text) {
    return `
      <div class="loading">
        <div class="loader"></div>
        <strong>${esc(text)}</strong>
      </div>
    `;
  }

  function show(el, html) {
    if (el) el.innerHTML = html;
  }

  function errorBox(message) {
    return `
      <div class="error-box">
        ❌ ${esc(message)}
      </div>
    `;
  }

  function dateForAPI(date) {
    if (!date) return "";

    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!m) return date;

    return `${m[3]}-${m[2]}-${m[1]}`;
  }

  /* =========================
     API
  ========================= */

  async function callAPI(params) {

    const query = new URLSearchParams(params);

    const response = await fetch(
      `/api/railway?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
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
        "Railway API request failed."
      );
    }

    return data;
  }

  /* =========================
     STATION AUTOCOMPLETE
  ========================= */

  function setupStation(inputId, boxId) {

    const input = $(inputId);
    const box = $(boxId);

    if (!input || !box) return;

    input.addEventListener("input", () => {

      const q =
        input.value.trim().toUpperCase();

      input.dataset.code = "";

      if (!q) {
        box.innerHTML = "";
        box.style.display = "none";
        return;
      }

      const matches = stations
        .filter(s =>
          s[0].includes(q) ||
          s[1].toUpperCase().includes(q)
        )
        .slice(0, 8);

      if (!matches.length) {
        box.innerHTML = "";
        box.style.display = "none";
        return;
      }

      box.innerHTML = matches.map(s => `
        <div
          class="station-suggestion"
          data-code="${esc(s[0])}"
          data-name="${esc(s[1])}"
        >
          <div class="station-suggestion-icon">
            🚉
          </div>

          <div>
            <strong>${esc(s[1])}</strong>
            <span>${esc(s[0])} • ${esc(s[2])}</span>
          </div>
        </div>
      `).join("");

      box.style.display = "block";

      box.querySelectorAll(
        ".station-suggestion"
      ).forEach(item => {

        item.addEventListener("click", () => {

          input.value =
            `${item.dataset.name} (${item.dataset.code})`;

          input.dataset.code =
            item.dataset.code;

          box.innerHTML = "";
          box.style.display = "none";
        });

      });

    });

    input.addEventListener("keydown", e => {

      if (e.key === "Escape") {
        box.innerHTML = "";
        box.style.display = "none";
      }

    });
  }

  [
    ["fromStation", "fromSuggestions"],
    ["toStation", "toSuggestions"],
    ["seatFrom", "seatFromSuggestions"],
    ["seatTo", "seatToSuggestions"],
    ["fareFrom", "fareFromSuggestions"],
    ["fareTo", "fareToSuggestions"],
    ["stationCode", "stationSuggestions"]
  ].forEach(x => setupStation(x[0], x[1]));

  function stationCode(id) {

    const input = $(id);

    if (!input) return "";

    if (input.dataset.code) {
      return input.dataset.code;
    }

    const text =
      input.value.trim().toUpperCase();

    const found =
      stations.find(
        s => s[0] === text
      );

    if (found) return found[0];

    const match =
      text.match(/\(([A-Z]{2,5})\)/);

    return match
      ? match[1]
      : text;
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
          .replace(/\D/g, "")
          .slice(0, 10);

      const box = $("result");
      const button = $("checkBtn");

      if (!/^\d{10}$/.test(pnr)) {
        show(
          box,
          errorBox("10 digit valid PNR enter karo.")
        );
        return;
      }

      button.disabled = true;
      button.textContent = "⏳ CHECKING...";

      show(
        box,
        loading("PNR status check ho raha hai...")
      );

      try {

        const result = await callAPI({
          action: "pnr",
          pnr
        });

        renderPNR(
          result?.data || result
        );

      } catch (err) {

        show(
          box,
          errorBox(err.message)
        );

      } finally {

        button.disabled = false;
        button.textContent =
          "🔎 CHECK PNR STATUS";

      }
    }
  );

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

    show(
      $("result"),
      `
        <div class="result-card">

          <div class="result-head">

            <small>PNR RESULT</small>

            <h2>
              PNR ${esc(
                pick(d, ["pnr"])
              )}
            </h2>

            <p>
              ${esc(
                pick(
                  d,
                  ["status", "message"],
                  "PNR Status"
                )
              )}
            </p>

          </div>

          <div class="route">

            <div>
              <small>FROM</small>

              <b>
                ${esc(
                  pick(
                    source,
                    ["name", "stationName", "code"]
                  )
                )}
              </b>
            </div>

            <div class="arrow">→</div>

            <div class="right">
              <small>TO</small>

              <b>
                ${esc(
                  pick(
                    destination,
                    ["name", "stationName", "code"]
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
                  pick(
                    train,
                    ["name", "trainName"]
                  )
                )}
              </b>
            </div>

            <div>
              <small>TRAIN NUMBER</small>
              <b>
                ${esc(
                  pick(
                    train,
                    [
                      "number",
                      "trainNumber",
                      "trainNo"
                    ]
                  )
                )}
              </b>
            </div>

            <div>
              <small>JOURNEY DATE</small>
              <b>
                ${esc(
                  pick(
                    journey,
                    [
                      "date",
                      "dateOfJourney"
                    ]
                  )
                )}
              </b>
            </div>

            <div>
              <small>CLASS</small>
              <b>
                ${esc(
                  pick(
                    journey,
                    ["class"]
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

                  ${passengers.map((p, i) => {

                    const booking =
                      p?.booking || {};

                    const current =
                      p?.current || {};

                    return `
                      <div class="passenger">

                        <div class="passenger-top">

                          <b>
                            Passenger ${i + 1}
                          </b>

                          <span class="unknown">
                            ${esc(
                              pick(
                                current,
                                [
                                  "status",
                                  "details"
                                ]
                              )
                            )}
                          </span>

                        </div>

                        <div class="passenger-info">

                          <div>
                            <small>
                              BOOKING STATUS
                            </small>

                            <b>
                              ${esc(
                                pick(
                                  booking,
                                  [
                                    "status",
                                    "details"
                                  ]
                                )
                              )}
                            </b>
                          </div>

                          <div>
                            <small>
                              CURRENT STATUS
                            </small>

                            <b>
                              ${esc(
                                pick(
                                  current,
                                  [
                                    "status",
                                    "details"
                                  ]
                                )
                              )}
                            </b>
                          </div>

                          <div>
                            <small>COACH</small>

                            <b>
                              ${esc(
                                pick(
                                  current,
                                  [
                                    "coach",
                                    "coachNumber"
                                  ]
                                )
                              )}
                            </b>
                          </div>

                          <div>
                            <small>SEAT / BERTH</small>

                            <b>
                              ${esc(
                                pick(
                                  current,
                                  [
                                    "berthNo",
                                    "berth",
                                    "seat"
                                  ]
                                )
                              )}
                            </b>
                          </div>

                        </div>

                      </div>
                    `;

                  }).join("")}

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
          errorBox(
            "5 digit train number enter karo."
          )
        );
        return;
      }

      show(
        box,
        loading("Live train status fetch ho raha hai...")
      );

      try {

        const result = await callAPI({
          action: "live",
          trainNo,
          date: dateForAPI(date)
        });

        renderLive(
          box,
          result
        );

      } catch (err) {

        show(
          box,
          errorBox(err.message)
        );

      }
    }
  );

  function renderLive(box, result) {

    const d =
      result?.data ||
      result;

    const list =
      d?.stations ||
      d?.timeline ||
      d?.route ||
      [];

    show(
      box,
      `
        <div class="data-box">

          <h3>🚆 Live Train Status</h3>

          <p>
            <b>Train:</b>
            ${esc(
              pick(
                d,
                ["train_name", "trainName", "name"]
              )
            )}
          </p>

          <p>
            <b>Train Number:</b>
            ${esc(
              pick(
                d,
                [
                  "train_no",
                  "trainNo",
                  "trainNumber"
                ]
              )
            )}
          </p>

          <p>
            <b>Current Status:</b>
            ${esc(
              pick(
                d,
                [
                  "status",
                  "status_note",
                  "statusNote",
                  "message"
                ]
              )
            )}
          </p>

          ${
            Array.isArray(list) && list.length
              ? `
                <h4>Station Updates</h4>

                <div class="train-list">

                  ${list.map(s => `

                    <div class="train-item">

                      <strong>
                        🚉 ${esc(
                          pick(
                            s,
                            [
                              "station_name",
                              "stationName",
                              "name",
                              "station"
                            ]
                          )
                        )}
                      </strong>

                      <p>
                        🟢 Arrival:
                        ${esc(
                          pick(
                            s,
                            [
                              "arrival",
                              "arrival_time",
                              "actual_arrival"
                            ]
                          )
                        )}
                      </p>

                      <p>
                        🔵 Departure:
                        ${esc(
                          pick(
                            s,
                            [
                              "departure",
                              "departure_time",
                              "actual_departure"
                            ]
                          )
                        )}
                      </p>

                      <p>
                        🚉 Platform:
                        ${esc(
                          pick(
                            s,
                            [
                              "platform",
                              "platform_number"
                            ]
                          )
                        )}
                      </p>

                    </div>

                  `).join("")}

                </div>
              `
              : `
                <p>
                  Live station-wise details API ne nahi diye.
                </p>
              `
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
        stationCode("fromStation");

      const to =
        stationCode("toStation");

      const date =
        $("searchDate").value;

      const box =
        $("searchResult");

      if (!from || !to) {
        show(
          box,
          errorBox(
            "From aur To station select karo."
          )
        );
        return;
      }

      if (from === to) {
        show(
          box,
          errorBox(
            "From aur To station same nahi ho sakte."
          )
        );
        return;
      }

      show(
        box,
        loading("Trains search ho rahi hain...")
      );

      try {

        const result = await callAPI({
          action: "search",
          from,
          to,
          date: dateForAPI(date)
        });

        renderSearch(
          box,
          result
        );

      } catch (err) {

        show(
          box,
          errorBox(err.message)
        );

      }
    }
  );

  function renderSearch(box, result) {

    /*
      IMPORTANT:
      New railway.js returns:
      result.display
    */

    let trains =
      Array.isArray(result?.display)
        ? result.display
        : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
        ? result
        : [];

    if (!trains.length) {

      show(
        box,
        `
          <div class="data-box">
            <h3>🔎 Train Search</h3>
            <p>
              Is route par train data available nahi hai.
            </p>
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

            ${trains.map(t => {

              const no =
                pick(
                  t,
                  [
                    "trainNo",
                    "train_no",
                    "trainNumber",
                    "number"
                  ]
                );

              const name =
                pick(
                  t,
                  [
                    "trainName",
                    "train_name",
                    "name"
                  ]
                );

              const fromName =
                pick(
                  t,
                  [
                    "from",
                    "from_stn_name",
                    "source"
                  ]
                );

              const toName =
                pick(
                  t,
                  [
                    "to",
                    "to_stn_name",
                    "destination"
                  ]
                );

              const departure =
                pick(
                  t,
                  [
                    "departure",
                    "from_time",
                    "departureTime"
                  ]
                );

              const arrival =
                pick(
                  t,
                  [
                    "arrival",
                    "to_time",
                    "arrivalTime"
                  ]
                );

              const duration =
                pick(
                  t,
                  [
                    "travelTime",
                    "travel_time",
                    "duration"
                  ]
                );

              const days =
                pick(
                  t,
                  [
                    "runningDays",
                    "running_days"
                  ]
                );

              return `
                <div class="train-item">

                  <strong>
                    🚆 ${esc(no)} —
                    ${esc(name)}
                  </strong>

                  <p>
                    📍 ${esc(fromName)}
                    →
                    ${esc(toName)}
                  </p>

                  <p>
                    🟢 Departure:
                    <b>${esc(departure)}</b>
                  </p>

                  <p>
                    🔴 Arrival:
                    <b>${esc(arrival)}</b>
                  </p>

                  <p>
                    ⏱️ Journey:
                    ${esc(duration)}
                  </p>

                  <p>
                    📅 Running:
                    ${esc(days)}
                  </p>

                </div>
              `;

            }).join("")}

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
        stationCode("stationCode");

      const hours =
        $("stationHours").value;

      const box =
        $("stationResult");

      if (!station) {
        show(
          box,
          errorBox(
            "Station select karo."
          )
        );
        return;
      }

      show(
        box,
        loading("Station ka live data fetch ho raha hai...")
      );

      try {

        const result = await callAPI({
          action: "station",
          station,
          hours
        });

        renderStation(
          box,
          result
        );

      } catch (err) {

        show(
          box,
          errorBox(err.message)
        );

      }
    }
  );

  function renderStation(box, result) {

    const d =
      result?.data ||
      result;

    const trains =
      Array.isArray(result?.display)
        ? result.display
        : Array.isArray(d?.trains)
        ? d.trains
        : [];

    if (!trains.length) {

      show(
        box,
        `
          <div class="data-box">
            <h3>🚉 Live Station</h3>
            <p>
              Is time ke liye train data available nahi hai.
            </p>
          </div>
        `
      );

      return;
    }

    show(
      box,
      `
        <div class="data-box">

          <h3>🚉 Live Station</h3>

          <p>
            <b>${trains.length}</b>
            trains found
          </p>

          <div class="train-list">

            ${trains.map(t => `

              <div class="train-item">

                <strong>
                  🚆 ${esc(
                    pick(
                      t,
                      [
                        "trainNo",
                        "train_no",
                        "trainNumber"
                      ]
                    )
                  )}
                  —
                  ${esc(
                    pick(
                      t,
                      [
                        "trainName",
                        "train_name",
                        "name"
                      ]
                    )
                  )}
                </strong>

                <p>
                  📍 ${esc(
                    pick(
                      t,
                      [
                        "from",
                        "sourceName",
                        "source"
                      ]
                    )
                  )}
                  →
                  ${esc(
                    pick(
                      t,
                      [
                        "to",
                        "destName",
                        "destination"
                      ]
                    )
                  )}
                </p>

                <p>
                  🟢 Arrival:
                  ${esc(
                    pick(
                      t,
                      [
                        "arrival",
                        "arrivalTime",
                        "scheduledArrival"
                      ]
                    )
                  )}
                </p>

                <p>
                  🚉 Platform:
                  ${esc(
                    pick(
                      t,
                      [
                        "platform",
                        "platformNumber"
                      ]
                    )
                  )}
                </p>

                <p>
                  ⏱️ Delay:
                  ${esc(
                    pick(
                      t,
                      [
                        "delay",
                        "delayMinutes"
                      ],
                      "0"
                    )
                  )} min
                </p>

              </div>

            `).join("")}

          </div>

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
        stationCode("seatFrom");

      const to =
        stationCode("seatTo");

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
          errorBox(
            "Train, From, To aur Date complete karo."
          )
        );

        return;
      }

      show(
        box,
        loading("Seat availability check ho rahi hai...")
      );

      try {

        const result = await callAPI({
          action: "seats",
          trainNo,
          from,
          to,
          date: dateForAPI(date),
          coach,
          quota
        });

        renderSeats(
          box,
          result
        );

      } catch (err) {

        show(
          box,
          errorBox(err.message)
        );

      }
    }
  );

  function renderSeats(box, result) {

    const d =
      result?.display ||
      result?.data ||
      result;

    const availability =
      Array.isArray(d?.availability)
        ? d.availability
        : Array.isArray(
            result?.data?.availability
          )
        ? result.data.availability
        : [];

    show(
      box,
      `
        <div class="data-box">

          <h3>💺 Seat Availability</h3>

          <p>
            <b>Train:</b>
            ${esc(
              pick(
                d,
                [
                  "trainName",
                  "train_name"
                ]
              )
            )}
          </p>

          <p>
            <b>Route:</b>
            ${esc(
              pick(
                d,
                ["from"]
              )
            )}
            →
            ${esc(
              pick(
                d,
                ["to"]
              )
            )}
          </p>

          ${
            availability.length
              ? `
                <div class="availability-list">

                  ${availability.map(a => `

                    <div class="availability-item">

                      <strong>
                        ${esc(
                          pick(
                            a,
                            [
                              "date",
                              "journeyDate"
                            ]
                          )
                        )}
                      </strong>

                      <span>
                        ${esc(
                          pick(
                            a,
                            [
                              "status",
                              "availability",
                              "prediction"
                            ]
                          )
                        )}
                      </span>

                      <small>
                        ${esc(
                          pick(
                            a,
                            ["fare"]
                          )
                        )}
                      </small>

                    </div>

                  `).join("")}

                </div>
              `
              : `
                <p>
                  💺 Availability:
                  <b>
                    ${esc(
                      pick(
                        d,
                        [
                          "availability",
                          "status"
                        ]
                      )
                    )}
                  </b>
                </p>
              `
          }

          <hr>

          <p>
            Base Fare:
            ₹${esc(
              pick(
                d,
                ["baseFare"]
              )
            )}
          </p>

          <p>
            Total Fare:
            ₹${esc(
              pick(
                d,
                ["totalFare"]
              )
            )}
          </p>

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
        stationCode("fareFrom");

      const to =
        stationCode("fareTo");

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
          errorBox(
            "Train, From, To aur Date complete karo."
          )
        );

        return;
      }

      show(
        box,
        loading("Fare calculate ho raha hai...")
      );

      try {

        const result = await callAPI({
          action: "fare",
          trainNo,
          from,
          to,
          date: dateForAPI(date),
          travelClass,
          quota
        });

        renderFare(
          box,
          result
        );

      } catch (err) {

        show(
          box,
          errorBox(err.message)
        );

      }
    }
  );

  function renderFare(box, result) {

    const d =
      result?.data ||
      result;

    show(
      box,
      `
        <div class="data-box">

          <h3>💰 Fare Details</h3>

          <p>
            <b>Train:</b>
            ${esc(
              pick(
                d,
                [
                  "trainName",
                  "train_name"
                ]
              )
            )}
          </p>

          <p>
            <b>Base Fare:</b>
            ₹${esc(
              pick(
                d,
                [
                  "baseFare",
                  "base_fare"
                ]
              )
            )}
          </p>

          <p>
            <b>Reservation:</b>
            ₹${esc(
              pick(
                d,
                [
                  "reservation",
                  "reservationCharge"
                ]
              )
            )}
          </p>

          <p>
            <b>Superfast:</b>
            ₹${esc(
              pick(
                d,
                [
                  "superfast",
                  "superfastCharge"
                ]
              )
            )}
          </p>

          <p>
            <b>GST:</b>
            ₹${esc(
              pick(
                d,
                [
                  "gst",
                  "gstAmount"
                ]
              )
            )}
          </p>

          <hr>

          <h2>
            Total:
            ₹${esc(
              pick(
                d,
                [
                  "totalFare",
                  "total",
                  "fare"
                ]
              )
            )}
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
          errorBox(
            "5 digit train number enter karo."
          )
        );

        return;
      }

      show(
        box,
        loading("Train information fetch ho rahi hai...")
      );

      try {

        const result = await callAPI({
          action: "train",
          trainNo
        });

        renderTrainInfo(
          box,
          result
        );

      } catch (err) {

        show(
          box,
          errorBox(err.message)
        );

      }
    }
  );

  function renderTrainInfo(box, result) {

    const d =
      result?.display ||
      result?.data?.trainInfo ||
      result?.data ||
      result;

    show(
      box,
      `
        <div class="data-box">

          <h3>🗺️ Train Information</h3>

          <p>
            <b>Train Number:</b>
            ${esc(
              pick(
                d,
                [
                  "trainNo",
                  "train_no",
                  "trainNumber"
                ]
              )
            )}
          </p>

          <p>
            <b>Train Name:</b>
            ${esc(
              pick(
                d,
                [
                  "trainName",
                  "train_name",
                  "name"
                ]
              )
            )}
          </p>

          <p>
            <b>From:</b>
            ${esc(
              pick(
                d,
                [
                  "from",
                  "from_stn_name"
                ]
              )
            )}
          </p>

          <p>
            <b>To:</b>
            ${esc(
              pick(
                d,
                [
                  "to",
                  "to_stn_name"
                ]
              )
            )}
          </p>

          <p>
            <b>Departure:</b>
            ${esc(
              pick(
                d,
                [
                  "departure",
                  "from_time"
                ]
              )
            )}
          </p>

          <p>
            <b>Arrival:</b>
            ${esc(
              pick(
                d,
                [
                  "arrival",
                  "to_time"
                ]
              )
            )}
          </p>

          <p>
            <b>Journey Time:</b>
            ${esc(
              pick(
                d,
                [
                  "travelTime",
                  "travel_time",
                  "duration"
                ]
              )
            )}
          </p>

          <p>
            <b>Running Days:</b>
            ${esc(
              pick(
                d,
                [
                  "runningDays",
                  "running_days"
                ]
              )
            )}
          </p>

        </div>
      `
    );
  }

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
          errorBox(
            "Train number aur date required hai."
          )
        );

        return;
      }

      show(
        box,
        loading("Train history fetch ho rahi hai...")
      );

      try {

        const result = await callAPI({
          action: "history",
          trainNo,
          date: dateForAPI(date)
        });

        renderHistory(
          box,
          result
        );

      } catch (err) {

        show(
          box,
          errorBox(err.message)
        );

      }
    }
  );

  function renderHistory(box, result) {

    const d =
      result?.data ||
      result;

    const list =
      Array.isArray(d)
        ? d
        : Array.isArray(d?.records)
        ? d.records
        : Array.isArray(d?.history)
        ? d.history
        : [];

    if (!list.length) {

      show(
        box,
        `
          <div class="data-box">
            <h3>📜 Train History</h3>
            <p>
              ${esc(
                pick(
                  d,
                  [
                    "message",
                    "status"
                  ],
                  "History data available nahi hai."
                )
              )}
            </p>
          </div>
        `
      );

      return;
    }

    show(
      box,
      `
        <div class="data-box">

          <h3>📜 Train History</h3>

          <div class="train-list">

            ${list.map(x => `

              <div class="train-item">

                <strong>
                  📅 ${esc(
                    pick(
                      x,
                      [
                        "date",
                        "journeyDate"
                      ]
                    )
                  )}
                </strong>

                <p>
                  Status:
                  ${esc(
                    pick(
                      x,
                      [
                        "status",
                        "message"
                      ]
                    )
                  )}
                </p>

                <p>
                  Arrival:
                  ${esc(
                    pick(
                      x,
                      [
                        "arrival",
                        "arrivalTime"
                      ]
                    )
                  )}
                </p>

                <p>
                  Departure:
                  ${esc(
                    pick(
                      x,
                      [
                        "departure",
                        "departureTime"
                      ]
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
     CANCELLED TRAINS
  ========================= */

  $("cancelledBtn")?.addEventListener(
    "click",
    async () => {

      const box =
        $("cancelledResult");

      const button =
        $("cancelledBtn");

      button.disabled = true;
      button.textContent =
        "⏳ Loading...";

      show(
        box,
        loading(
          "Cancelled trains fetch ho rahi hain..."
        )
      );

      try {

        const result =
          await callAPI({
            action: "cancelled"
          });

        renderCancelled(
          box,
          result
        );

      } catch (err) {

        show(
          box,
          errorBox(err.message)
        );

      } finally {

        button.disabled = false;
        button.textContent =
          "Check Cancelled Trains";

      }
    }
  );

  function renderCancelled(box, result) {

    const d =
      result?.data ||
      result;

    const list =
      Array.isArray(d)
        ? d
        : Array.isArray(d?.trains)
        ? d.trains
        : Array.isArray(d?.cancelled)
        ? d.cancelled
        : [];

    if (!list.length) {

      show(
        box,
        `
          <div class="data-box">

            <h3>❌ Cancelled Trains</h3>

            <p>
              Aaj ke liye cancelled train data available nahi hai.
            </p>

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
            ❌ Cancelled Trains
          </h3>

          <div class="train-list">

            ${list.map(t => `

              <div class="train-item">

                <strong>
                  ❌ ${esc(
                    pick(
                      t,
                      [
                        "trainNo",
                        "train_no",
                        "trainNumber"
                      ]
                    )
                  )}
                  —
                  ${esc(
                    pick(
                      t,
                      [
                        "trainName",
                        "train_name",
                        "name"
                      ]
                    )
                  )}
                </strong>

                <p>
                  📍 ${esc(
                    pick(
                      t,
                      [
                        "from",
                        "source",
                        "sourceName"
                      ]
                    )
                  )}
                  →
                  ${esc(
                    pick(
                      t,
                      [
                        "to",
                        "destination",
                        "destName"
                      ]
                    )
                  )}
                </p>

                <p>
                  🔴 Status:
                  ${esc(
                    pick(
                      t,
                      [
                        "status",
                        "reason",
                        "cancelled"
                      ],
                      "Cancelled"
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

});
