# Trading Price Streaming Service

I built the system that delivers real-time trading prices in a scalable and efficient way. The main challenge was supporting multiple tickers per client without overwhelming the backend or network, and working around the fact that Next.js does not natively support HTTP/2 streaming.

Instead of opening a separate stream for each ticker, I designed the system with **two RPC methods**:

1. **`StreamPrices`** — establishes a single persistent stream for each client.
2. **`ModifyTickers`** — allows clients to add or remove tickers dynamically without creating new connections.

This architecture ensures that each client has only one open stream while still being able to adjust the tickers they track.

---

## How It Works

### 1. Proto Definition

The `.proto` file defines the API contract between frontend and backend. It specifies:

- **`StreamPrices`** for real-time price streaming.
- **`ModifyTickers`** for dynamically updating a client’s watchlist.
- Response messages that include ticker, price, or error.

### 2. Backend

The backend maintains a mapping of **clientId → ticker set**.

- **StreamPrices**: Uses Playwright to scrape TradingView in real time. All tickers are processed in parallel so one slow ticker does not block others. Results are streamed back continuously. Invalid tickers are removed automatically, with an error sent to the client.
- **ModifyTickers**: Updates the client’s ticker set without interrupting the existing stream. The next processing cycle automatically reflects these changes.

This design ensures the backend always knows what each client is watching and only sends relevant updates.

### 3. Frontend

Each user session has a unique **clientId**.

- On app load, the frontend calls **`streamPrices(clientId)`** once.
- To add a ticker: **`modifyTickers({ clientId, add: "BTCUSDT" })`**.
- To remove a ticker: **`modifyTickers({ clientId, remove: "BTCUSDT" })`**.

The UI shows live updates, highlights price changes, and removes invalid tickers when errors occur.

---
