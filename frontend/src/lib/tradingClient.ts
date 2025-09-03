// lib/tradingClient.ts
import { createClient } from "@connectrpc/connect";
import { TradingService } from "../../../proto/connect/proto/trading/v1/trading_pb";
import { createConnectTransport } from "@connectrpc/connect-web";

const transport =
  createConnectTransport(
    {
      baseUrl:
        "http://localhost:8080", // your Node.js server URL
    }
  );

export const tradingClient =
  createClient(
    TradingService,
    transport
  );
