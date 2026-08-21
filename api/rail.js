import {
  configure,
  trackTrain,
  getTrainInfo,
  liveAtStation,
  searchTrainBetweenStations,
  getAvailability,
  fareLookup
} from "railkit";

export default {
  async fetch(request) {

    try {

      const apiKey = process.env.RAILKIT_API_KEY;

      if (!apiKey) {
        return Response.json({
          success: false,
          message: "RAILKIT_API_KEY is missing in Vercel."
        }, { status: 500 });
      }

      configure(apiKey);

      const url = new URL(request.url);
      const action = url.searchParams.get("action");

      const date = url.searchParams.get("date");
      const train = url.searchParams.get("train");
      const from = (url.searchParams.get("from") || "").toUpperCase();
      const to = (url.searchParams.get("to") || "").toUpperCase();

      let result;


      /* LIVE TRAIN */

      if (action === "live") {

        if (!/^\d{5}$/.test(train || "")) {
          return Response.json({
            success: false,
            message: "Enter a valid 5-digit train number."
          }, { status: 400 });
        }

        if (!date) {
          return Response.json({
            success: false,
            message: "Journey date is required."
          }, { status: 400 });
        }

        result = await trackTrain(
          train,
          toRailDate(date)
        );
      }


      /* TRAIN INFO */

      else if (action === "train") {

        if (!/^\d{5}$/.test(train || "")) {
          return Response.json({
            success: false,
            message: "Enter a valid 5-digit train number."
          }, { status: 400 });
        }

        result = await getTrainInfo(train);
      }


      /* LIVE STATION */

      else if (action === "station") {

        const station = (
          url.searchParams.get("station") || ""
        ).toUpperCase();

        if (!/^[A-Z]{2,5}$/.test(station)) {
          return Response.json({
            success: false,
            message: "Enter a valid station code."
          }, { status: 400 });
        }

        result = await liveAtStation(station, 2);
      }


      /* TRAIN BETWEEN STATIONS */

      else if (action === "search") {

        if (!from || !to) {
          return Response.json({
            success: false,
            message: "From and To station codes are required."
          }, { status: 400 });
        }

        result = await searchTrainBetweenStations(
          from,
          to
        );
      }


      /* SEAT AVAILABILITY */

      else if (action === "availability") {

        const coach = (
          url.searchParams.get("coach") || ""
        ).toUpperCase();

        const quota = (
          url.searchParams.get("quota") || ""
        ).toUpperCase();

        if (
          !/^\d{5}$/.test(train || "") ||
          !from ||
          !to ||
          !date ||
          !coach ||
          !quota
        ) {
          return Response.json({
            success: false,
            message: "Train, From, To, Date, Class and Quota are required."
          }, { status: 400 });
        }

        result = await getAvailability(
          train,
          from,
          to,
          toRailDate(date),
          coach,
          quota
        );
      }


      /* FARE */

      else if (action === "fare") {

        const coach = (
          url.searchParams.get("coach") || ""
        ).toUpperCase();

        const quota = (
          url.searchParams.get("quota") || ""
        ).toUpperCase();

        if (
          !/^\d{5}$/.test(train || "") ||
          !from ||
          !to ||
          !date ||
          !coach ||
          !quota
        ) {
          return Response.json({
            success: false,
            message: "Train, From, To, Date, Class and Quota are required."
          }, { status: 400 });
        }

        result = await fareLookup(
          train,
          from,
          to,
          toRailDate(date),
          coach,
          quota
        );
      }


      else {

        return Response.json({
          success: false,
          message: "Invalid railway service."
        }, { status: 400 });

      }


      return Response.json(result, {
        status: result?.success === false ? 400 : 200
      });

    } catch (error) {

      console.error("AINEX RailKit Error:", error);

      return Response.json({
        success: false,
        message:
          error?.message ||
          "RailKit request failed."
      }, { status: 500 });
    }
  }
};


/* YYYY-MM-DD → DD-MM-YYYY */

function toRailDate(date) {

  if (!date) return "";

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
