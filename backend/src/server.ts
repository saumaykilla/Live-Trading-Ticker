import express from "express";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import { tradingService } from "../services/trading_services";

const app =
  express();

const port = 8080;

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
      `Running the backend on port : ${port}`
    );
  }
);
