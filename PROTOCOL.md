# Legacy Portal Investigation and Protocol

## 1. Overview

This document describes the investigation of the legacy Urja Meter Ops portal and the protocol used by the Flock Energy API wrapper.

The wrapper communicates with the portal over HTTP and exposes a versioned REST API for meter search, meter details, energy consumption, and location data.

## 2. Investigation Method

The portal was inspected through its browser interface and browser developer tools.

The investigation focused on:

- Observing the login request and response.
- Identifying the authentication mechanism.
- Inspecting network requests triggered by meter search and detail pages.
- Examining the responses returned for energy consumption and location.
- Reproducing the relevant requests from Node.js.

All implemented operations are read-only.

## 3. Authentication

### Observed behavior

The portal login uses an HTTP POST request to `/login`. The request submits URL-encoded form fields:

- `email`
- `password`

The initial login attempt returned HTTP 403 with a message indicating that cross-site form submissions were forbidden. Loading the portal first and sending the appropriate `Origin` and `Referer` headers allowed the login flow to proceed.

The successful login response indicated a redirect to `/meters` and established a session cookie.

### Implementation

The wrapper uses:

- `dotenv` to load credentials from environment variables.
- `axios` to make HTTP requests.
- `tough-cookie` to store session cookies.
- `axios-cookiejar-support` to connect the cookie jar to the Axios client.

The `login()` function initializes the portal session. The `ensureLoggedIn()` helper shares the login promise across concurrent requests so they do not independently start multiple logins.

Credentials are kept outside source code in `.env`.

## 4. Discovered Portal Endpoints

The following endpoints were observed during investigation and are used by the wrapper.

| Method | Portal endpoint | Purpose |
|---|---|---|
| GET | `/` | Load the portal before authentication |
| POST | `/login` | Submit login credentials |
| GET | `/portal/meters/search?q={query}&page={page}` | Search meters |
| GET | `/portal/meters/{id}/energy` | Retrieve energy readings |
| GET | `/portal/meters/{id}/geo` | Retrieve location coordinates |

The meter detail operation in the wrapper currently uses the meter search endpoint with the meter ID as the query, then selects the matching meter from the returned results.

## 5. Response Formats

### Meter search

The search endpoint returns a JSON response containing a `data` array and pagination metadata, including `total`, `page`, and `pageSize`.

Meter records can contain fields such as:

- `meterId`
- `serialNo`
- `make`
- `phaseType`
- `installStatus`
- `dtCode`

### Energy readings

The energy endpoint returns a JSON object containing a `data` array. Observed readings include fields such as:

- `timestamp`
- `kwh`
- `kvah`
- `voltR`

The observed measurement values were represented as strings in the portal response.

### Location

The location endpoint returns a JSON object containing a `data` object with `latitude` and `longitude` fields. The observed coordinate values were represented as strings.

## 6. Wrapper API Mapping

| Wrapper endpoint | Portal operation |
|---|---|
| `GET /` | Local health check |
| `GET /api/v1/meters?q={query}&page={page}` | Meter search |
| `GET /api/v1/meters/{id}` | Search and select a matching meter |
| `GET /api/v1/meters/{id}/consumption` | Energy readings |
| `GET /api/v1/meters/{id}/location` | Location coordinates |

The wrapper returns JSON responses and provides simplified error messages to API clients.

## 7. Session Management

The portal client uses a cookie jar to preserve session cookies between requests.

The wrapper initializes authentication lazily when a protected API operation is called. The login promise is reused for concurrent requests and reset if login fails.

The current implementation does not explicitly detect every possible expired-session scenario or automatically retry a request after session expiry. Those behaviors could be added if required.

## 8. Error Handling

The wrapper catches errors from portal requests, logs limited diagnostic information on the server, and returns JSON error responses.

A meter that is not found through the detail operation returns HTTP 404.

Other portal or network failures are handled by the corresponding route's error handler. The current implementation uses route-specific status handling, so exact status codes can differ by endpoint.

## 9. Limitations and Assumptions

- The wrapper depends on the legacy portal's current routes, response structures, and authentication behavior.
- The meter detail operation relies on the search endpoint returning the requested meter.
- Portal session expiry and automatic reauthentication are not fully handled.
- Pagination input receives basic normalization, but stricter validation could be added.
- The API is intended for read-only access and does not implement meter updates or other write operations.

## 10. Security Considerations

- Credentials are loaded from environment variables rather than hard-coded.
- `.env` must be excluded from version control.
- Session cookies and credentials must not be returned to API clients or committed to the repository.
- Real portal data, including meter identifiers and coordinates, should not be included in public examples unless explicitly authorized.

## 11. Possible Improvements

- Add automated tests for success and error cases.
- Validate query parameters more strictly.
- Add explicit session-expiry detection and reauthentication.
- Standardize upstream error handling and status codes.
- Add request logging that avoids secrets and sensitive meter data.
