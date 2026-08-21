import { configure, checkPNRStatus } from "railkit";

export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const pnr = url.searchParams.get("pnr");

      if (!pnr || !/^\d{10}$/.test(pnr)) {
        return Response.json({
          success: false,
          message: "Please enter a valid 10-digit PNR number."
        }, { status: 400 });
      }

      const apiKey = process.env.RAILKIT_API_KEY;

      if (!apiKey) {
        return Response.json({
          success: false,
          message: "RAILKIT_API_KEY is missing in Vercel."
        }, { status: 500 });
      }

      configure(apiKey);

      const result = await checkPNRStatus(pnr);

      return Response.json(result, {
        status: result?.success === false ? 400 : 200
      });

    } catch (error) {

      console.error("AINEX RailKit Error:", error);

      return Response.json({
        success: false,
        message: error?.message || "RailKit request failed."
      }, { status: 500 });
    }
  }
};
