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

      const key = process.env.RAILKIT_API_KEY;

      if (!key) {
        return Response.json({
          success: false,
          message: "RAILKIT_API_KEY is missing."
        }, { status: 500 });
      }

      configure(key);

      const url = new URL(request.url);
      const action = url.searchParams.get("action");

      let result;

      if (action === "live") {

        const train = url.searchParams.get("train");
        const date = url.searchParams.get("date") || undefined;

        if (!/^\d{5}$/.test(train || "")) {
          return Response.json({
            success: false,
            message: "Enter a valid 5-digit train number."
          }, { status: 400 });
        }

        result = await trackTrain(train, date);

      } else if (action === "train") {

        const train = url.searchParams.get("train");

        if (!/^\d{5}$/.test(train || "")) {
          return Response.json({
            success: false,
            message: "Enter a valid 5-digit train number."
          }, { status: 400 });
        }

        result = await getTrainInfo(train);

      } else if (action === "station") {

        const station = (
          url.searchParams.get("station") || ""
        ).toUpperCase();

        if (!/^[A-Z]{2,5}$/.test(station)) {
          return Response.json({
            success: false,
            message: "Enter a valid station code."
          }, { status: 400 });
        }

        result = await liveAtStation(station);

      } else if (action === "search") {

        const from = (
          url.searchParams.get("from") || ""
        ).toUpperCase();

        const to = (
          url.searchParams.get("to") || ""
        ).toUpperCase();

        if (!from || !to) {
          return Response.json({
            success: false,
            message: "From and To station codes are required."
          }, { status: 400 });
        }

        result = await searchTrainBetweenStations(from, to);

      } else if (action === "availability") {

        const train = url.searchParams.get("train");
        const from = (
          url.searchParams.get("from") || ""
        ).toUpperCase();
        const to = (
          url.searchParams.get("to") || ""
        ).toUpperCase();
        const date = url.searchParams.get("date");
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
          date,
          coach,
          quota
        );

      } else if (action === "fare") {

        const train = url.searchParams.get("train");
        const from = (
          url.searchParams.get("from") || ""
        ).toUpperCase();
        const to = (
          url.searchParams.get("to") || ""
        ).toUpperCase();
        const date = url.searchParams.get("date");
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
          date,
          coach,
          quota
        );

      } else {

        return Response.json({
          success: false,
          message: "Invalid action."
        }, { status: 400 });

      }

      return Response.json(result, {
        status: result?.success === false ? 400 : 200
      });

    } catch (error) {

      console.error("AINEX Railway Error:", error);

      return Response.json({
        success: false,
        message: error?.message || "RailKit request failed."
      }, { status: 500 });

    }
  }
};
