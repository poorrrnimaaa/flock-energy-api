require("dotenv").config();

const express = require("express");
const { portalClient, login } = require("./portalClient");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let loginPromise = null;

async function ensureLoggedIn() {
  if (!loginPromise) {
    loginPromise = login().catch((error) => {
      loginPromise = null;
      throw error;
    });
  }

  await loginPromise;
}

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Flock Energy API is running",
  });
});

// Search and list meters
app.get("/api/v1/meters", async (req, res) => {
  try {
    await ensureLoggedIn();

    const q = String(req.query.q || "");
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const response = await portalClient.get("/portal/meters/search", {
      params: { q, page },
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Meter search failed:",
      error.response?.status || error.message
    );

    res.status(error.response?.status || 500).json({
      error: "Unable to search meters",
    });
  }
});

// Get details for one meter
app.get("/api/v1/meters/:id", async (req, res) => {
  try {
    await ensureLoggedIn();

    const meterId = req.params.id;

    const response = await portalClient.get("/portal/meters/search", {
      params: {
        q: meterId,
        page: 1,
      },
    });

    const meters = response.data.data || [];
    const meter = meters.find((item) => item.meterId === meterId);

    if (!meter) {
      return res.status(404).json({
        error: "Meter not found",
      });
    }

    res.json({ data: meter });
  } catch (error) {
    console.error(
      "Meter detail failed:",
      error.response?.status || error.message
    );

    res.status(500).json({
      error: "Unable to retrieve meter details",
    });
  }
});

// Get meter energy consumption
app.get("/api/v1/meters/:id/consumption", async (req, res) => {
  try {
    await ensureLoggedIn();

    const meterId = req.params.id;

    const response = await portalClient.get(
      `/portal/meters/${encodeURIComponent(meterId)}/energy`
    );

    res.json({
      meterId,
      data: response.data.data,
    });
  } catch (error) {
    console.error(
      "Meter consumption failed:",
      error.response?.status || error.message
    );

    res.status(error.response?.status || 500).json({
      error: "Unable to retrieve meter consumption",
    });
  }
});

// Get meter location
app.get("/api/v1/meters/:id/location", async (req, res) => {
  try {
    await ensureLoggedIn();

    const meterId = req.params.id;

    const response = await portalClient.get(
      `/portal/meters/${encodeURIComponent(meterId)}/geo`
    );

    res.json({
      meterId,
      data: response.data.data,
    });
  } catch (error) {
    console.error(
      "Meter location failed:",
      error.response?.status || error.message
    );

    res.status(error.response?.status || 500).json({
      error: "Unable to retrieve meter location",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});