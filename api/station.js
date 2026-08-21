import { configure, liveAtStation } from "railkit";

export default async function handler(req, res) {
  try {
    const station = String(req.query.station || "")
      .trim()
      .toUpperCase();

    const hours = Number(req.query.hours || 2);

    if (!/^[A-Z]{2,5}$/.test(station)) {
      return res.status(400).json({
        success: false,
        message: "Valid station code enter karein."
      });
    }

    const apiKey = process.env.RAILKIT_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "RAILKIT_API_KEY missing hai."
      });
    }

    configure(apiKey);

    const result = await liveAtStation(station, hours);

    return res.status(
      result?.success === false ? 400 : 200
    ).json(result);

  } catch (error) {
    console.error("AINEX Station Error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Live station request failed."
    });
  }
}
