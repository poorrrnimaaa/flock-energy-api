
require("dotenv").config();

const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");

const jar = new CookieJar();

const portalClient = wrapper(
  axios.create({
    baseURL: "https://urja-ops.flockenergy.tech",
    jar,
    withCredentials: true,
    timeout: 15000,
    headers: {
      Accept: "application/json",
    },
  })
);

async function login() {
  const email = process.env.PORTAL_EMAIL;
  const password = process.env.PORTAL_PASSWORD;

  if (!email || !password) {
    throw new Error("Portal credentials are missing from .env");
  }

  // Load the portal first to establish an initial session if needed.
  await portalClient.get("/");

  const formData = new URLSearchParams({
    email,
    password,
  });

  await portalClient.post("/login", formData.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://urja-ops.flockenergy.tech",
      Referer: "https://urja-ops.flockenergy.tech/",
    },
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
  });
}

module.exports = { portalClient, login };
