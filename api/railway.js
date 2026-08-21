import {
  configure,
  checkPNRStatus,
  getTrainInfo,
  trackTrain,
  getTrainHistory,
  liveAtStation,
  searchTrainBetweenStations,
  getAvailability,
  fareLookup,
  cancelList
} from "railkit";

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function dateToRailkit(date) {
  if (!date) return "";

  const m = String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!m) return date;

  return `${m[3]}-${m[2]}-${m[1]}`;
}

function clean(value) {
  return String(value || "").trim().toUpperCase();
}

export default {
  async fetch(request) {

    try {

      const url = new URL(request.url);

      const action = clean(
        url.searchParams.get("action")
      );

      const apiKey =
        process.env.RAILKIT_API_KEY;

      if (!apiKey) {
        return json({
          success: false,
          message:
            "RAILKIT_API_KEY Vercel Environment Variables me add nahi hai."
        }, 500);
      }

      configure(apiKey);


      /* =========================
         PNR
      ========================= */

      if (action === "PNR") {

        const pnr =
          (url.searchParams.get("pnr") || "")
          .replace(/\D/g, "");

        if (!/^\d{10}$/.test(pnr)) {
          return json({
            success: false,
            message:
              "Please enter a valid 10-digit PNR number."
          }, 400);
        }

        const result =
          await checkPNRStatus(pnr);

        return json(result);
      }


      /* =========================
         TRAIN INFORMATION
      ========================= */

      if (action === "TRAIN") {

        const trainNo =
          clean(
            url.searchParams.get("trainNo")
          );

        if (!/^\d{5}$/.test(trainNo)) {
          return json({
            success: false,
            message:
              "Please enter a valid 5-digit train number."
          }, 400);
        }

        const result =
          await getTrainInfo(trainNo);

        return json(result);
      }


      /* =========================
         LIVE TRAIN
      ========================= */

      if (action === "LIVE") {

        const trainNo =
          clean(
            url.searchParams.get("trainNo")
          );

        const date =
          dateToRailkit(
            url.searchParams.get("date")
          );

        if (!/^\d{5}$/.test(trainNo)) {
          return json({
            success: false,
            message:
              "Please enter a valid 5-digit train number."
          }, 400);
        }

        if (!date) {
          return json({
            success: false,
            message:
              "Journey date is required."
          }, 400);
        }

        const result =
          await trackTrain(
            trainNo,
            date
          );

        return json(result);
      }


      /* =========================
         TRAIN HISTORY
      ========================= */

      if (action === "HISTORY") {

        const trainNo =
          clean(
            url.searchParams.get("trainNo")
          );

        const date =
          dateToRailkit(
            url.searchParams.get("date")
          );

        if (!/^\d{5}$/.test(trainNo)) {
          return json({
            success: false,
            message:
              "Please enter a valid 5-digit train number."
          }, 400);
        }

        if (!date) {
          return json({
            success: false,
            message:
              "Journey date is required."
          }, 400);
        }

        const result =
          await getTrainHistory(
            trainNo,
            date
          );

        return json(result);
      }


      /* =========================
         LIVE STATION
      ========================= */

      if (action === "STATION") {

        const station =
          clean(
            url.searchParams.get("station")
          );

        const hours =
          Number(
            url.searchParams.get("hours") || 2
          );

        if (!/^[A-Z]{2,5}$/.test(station)) {
          return json({
            success: false,
            message:
              "Please enter a valid station code."
          }, 400);
        }

        if (![2, 4, 8].includes(hours)) {
          return json({
            success: false,
            message:
              "Hours must be 2, 4 or 8."
          }, 400);
        }

        const result =
          await liveAtStation(
            station,
            hours
          );

        return json(result);
      }


      /* =========================
         TRAIN SEARCH
      ========================= */

      if (action === "SEARCH") {

        const from =
          clean(
            url.searchParams.get("from")
          );

        const to =
          clean(
            url.searchParams.get("to")
          );

        const date =
          dateToRailkit(
            url.searchParams.get("date")
          );

        if (!/^[A-Z]{2,5}$/.test(from)) {
          return json({
            success: false,
            message:
              "Invalid From station code."
          }, 400);
        }

        if (!/^[A-Z]{2,5}$/.test(to)) {
          return json({
            success: false,
            message:
              "Invalid To station code."
          }, 400);
        }

        const result =
          await searchTrainBetweenStations(
            from,
            to,
            date || undefined
          );

        return json(result);
      }


      /* =========================
         SEAT AVAILABILITY
      ========================= */

      if (action === "SEATS") {

        const trainNo =
          clean(
            url.searchParams.get("trainNo")
          );

        const from =
          clean(
            url.searchParams.get("from")
          );

        const to =
          clean(
            url.searchParams.get("to")
          );

        const date =
          dateToRailkit(
            url.searchParams.get("date")
          );

        const coach =
          clean(
            url.searchParams.get("coach")
          );

        const quota =
          clean(
            url.searchParams.get("quota")
          );

        if (!/^\d{5}$/.test(trainNo)) {
          return json({
            success: false,
            message:
              "Invalid 5-digit train number."
          }, 400);
        }

        if (!/^[A-Z]{2,5}$/.test(from)) {
          return json({
            success: false,
            message:
              "Invalid From station."
          }, 400);
        }

        if (!/^[A-Z]{2,5}$/.test(to)) {
          return json({
            success: false,
            message:
              "Invalid To station."
          }, 400);
        }

        if (!date) {
          return json({
            success: false,
            message:
              "Journey date is required."
          }, 400);
        }

        if (!coach) {
          return json({
            success: false,
            message:
              "Class is required."
          }, 400);
        }

        if (!quota) {
          return json({
            success: false,
            message:
              "Quota is required."
          }, 400);
        }

        const result =
          await getAvailability(
            trainNo,
            from,
            to,
            date,
            coach,
            quota
          );

        return json(result);
      }


      /* =========================
         FARE
      ========================= */

      if (action === "FARE") {

        const trainNo =
          clean(
            url.searchParams.get("trainNo")
          );

        const from =
          clean(
            url.searchParams.get("from")
          );

        const to =
          clean(
            url.searchParams.get("to")
          );

        const date =
          dateToRailkit(
            url.searchParams.get("date")
          );

        const travelClass =
          clean(
            url.searchParams.get("travelClass")
          );

        const quota =
          clean(
            url.searchParams.get("quota")
          );

        if (!/^\d{5}$/.test(trainNo)) {
          return json({
            success: false,
            message:
              "Invalid 5-digit train number."
          }, 400);
        }

        if (!/^[A-Z]{2,5}$/.test(from)) {
          return json({
            success: false,
            message:
              "Invalid From station."
          }, 400);
        }

        if (!/^[A-Z]{2,5}$/.test(to)) {
          return json({
            success: false,
            message:
              "Invalid To station."
          }, 400);
        }

        if (!date) {
          return json({
            success: false,
            message:
              "Journey date is required."
          }, 400);
        }

        if (!travelClass) {
          return json({
            success: false,
            message:
              "Travel class is required."
          }, 400);
        }

        if (!quota) {
          return json({
            success: false,
            message:
              "Quota is required."
          }, 400);
        }

        const result =
          await fareLookup(
            trainNo,
            from,
            to,
            date,
            travelClass,
            quota
          );

        return json(result);
      }


      /* =========================
         CANCELLED TRAINS
      ========================= */

      if (action === "CANCELLED") {

        const result =
          await cancelList();

        return json(result);
      }


      /* =========================
         INVALID ACTION
      ========================= */

      return json({
        success: false,
        message:
          "Invalid railway service."
      }, 400);


    } catch (error) {

      console.error(
        "AINEX RAILWAY ERROR:",
        error
      );

      return json({
        success: false,
        message:
          error?.message ||
          "Railway API request failed."
      }, 500);

    }

  }
};
