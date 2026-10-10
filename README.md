# Flock Energy API Wrapper

A REST API wrapper for the legacy Urja Meter Ops portal. This project provides a simplified, versioned API for searching electricity meters and retrieving their details, energy consumption, and location.

## Features

- Session-based authentication with the Urja Meter Ops portal.
- Search and paginate through meters.
- Retrieve details for an individual meter.
- Retrieve energy consumption readings.
- Retrieve meter location coordinates.
- JSON responses and basic error handling.
- Read-only access to portal data.

## Tech Stack

- Node.js
- Express.js
- Axios
- Tough Cookie
- axios-cookiejar-support
- dotenv

## Prerequisites

- Node.js and npm installed.
- Access to the Urja Meter Ops portal and valid credentials.

## Installation

Clone the repository and navigate to the project directory:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd flock-energy-api
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
PORTAL_EMAIL=your_portal_email
PORTAL_PASSWORD=your_portal_password
```

Replace the placeholder credentials with your authorized portal credentials. **Never commit your `.env` file to GitHub.**

## Running the API

Start the server:

```bash
node server.js
```

The API will run at:

`http://localhost:3000`

Check that the server is running:

```bash
curl http://localhost:3000/
```

Expected response:

```json
{
  "message": "Flock Energy API is running"
}
```

## API Endpoints

All endpoints return JSON.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/v1/meters?q=J100001&page=1` | Search meters |
| GET | `/api/v1/meters/:id` | Retrieve one meter's details |
| GET | `/api/v1/meters/:id/consumption` | Retrieve energy consumption |
| GET | `/api/v1/meters/:id/location` | Retrieve meter coordinates |

### 1. Search meters

```http
GET /api/v1/meters?q=J100001&page=1
```

Query parameters:

- `q` — Search query; defaults to an empty string.
- `page` — Page number; defaults to page 1.

The response contains the portal's meter data and pagination information.

### 2. Get meter details

```http
GET /api/v1/meters/J100001
```

Example response:

```json
{
  "data": {
    "meterId": "J100001",
    "serialNo": "GE84132",
    "make": "L&T",
    "phaseType": "single",
    "installStatus": "Installed",
    "dtCode": "DT-002"
  }
}
```

The values above are illustrative examples of the response structure.

If the meter cannot be found, the endpoint returns `404 Meter not found`.

### 3. Get energy consumption

```http
GET /api/v1/meters/J100001/consumption
```

The response contains the meter ID and its consumption readings.

Example response structure:

```json
{
  "meterId": "EXAMPLE_METER",
  "data": [
    {
      "timestamp": "EXAMPLE_TIMESTAMP",
      "kwh": "EXAMPLE_VALUE",
      "kvah": "EXAMPLE_VALUE",
      "voltR": "EXAMPLE_VALUE"
    }
  ]
}
```

The portal provides readings containing timestamps and electrical measurements. The exact fields and values depend on the portal response.

### 4. Get meter location

```http
GET /api/v1/meters/J100001/location
```

Example response structure:

```json
{
  "meterId": "EXAMPLE_METER",
  "data": {
    "latitude": "EXAMPLE_LATITUDE",
    "longitude": "EXAMPLE_LONGITUDE"
  }
}
```

Actual coordinates are intentionally omitted from this example.

## Authentication

The wrapper reads portal credentials from environment variables. It uses Axios with a cookie jar to preserve the portal session after login.

The `ensureLoggedIn()` helper initializes login when an API endpoint first needs portal access and reuses the login promise for concurrent requests.

Credentials and session cookies are not intended to be exposed to API clients.

## Error Handling

The API returns JSON error messages when an operation fails. Examples include:

```json
{
  "error": "Meter not found"
}
```

```json
{
  "error": "Unable to retrieve meter location"
}
```

HTTP status codes indicate whether a request succeeded or failed. The health check returns HTTP 200 when the server is running.

## Project Structure

```text
flock-energy-api/
├── server.js
├── portalClient.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
├── README.md
├── PROTOCOL.md
└── openapi.json
```

The `.env` file is local configuration and must not be committed to the repository.

## Scope and Limitations

- The wrapper is read-only and does not modify meter data.
- It depends on the legacy portal's endpoints and authentication behavior.
- Portal changes may require updates to the wrapper.
- The wrapper currently exposes the meter search, detail, consumption, and location operations implemented in this project.

## License

Add a license if required by the assignment or if you intend to distribute the project publicly.
