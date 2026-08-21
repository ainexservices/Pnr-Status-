import { configure, checkPNRStatus } from "railkit";

export default async function handler(req, res) {

  res.setHeader("Content-Type", "application/json");

  const pnr = req.query?.pnr;

  if (!pnr || !/^\d{10}$/.test(pnr)) {
    return res.status(400).json({
      success: false,
      message: "Invalid 10-digit PNR"
    });
  }

  if (!process.env.RAILKIT_API_KEY) {
    return res.status(500).json({
      success: false,
      message: "RAILKIT_API_KEY is missing"
    });
  }

  try {

    configure(process.env.RAILKIT_API_KEY);

    const result = await checkPNRStatus(pnr);

    return res.status(200).json(result);

  } catch (error) {

    console.error("RAILKIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "RailKit request failed"
    });
  }
}
