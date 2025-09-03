import express from "express";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import cors from "cors";
import { tradingService } from "../services/trading_services.js";
const app =
  express();
const port = 8080;

// ✅ Enable CORS first
app.use(
  cors(
    {
      origin:
        "http://localhost:3000", // Next.js frontend
      methods:
        [
          "GET",
          "POST",
          "OPTIONS",
        ],
      allowedHeaders:
        [
          "Content-Type",
          "Connect-Protocol",
          "Connect-Timeout-Ms",
          "connect-protocol-version",
        ],
    }
  )
);

// ✅ Mount Connect routes after CORS
app.use(
  connectNodeAdapter(
    {
      routes:
        tradingService,
    }
  )
);

app.listen(
  port,
  () => {
    console.log(
      `✅ Backend running on http://localhost:${port}`
    );
  }
);
