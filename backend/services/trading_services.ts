import {
  TradingService,
  StreamPricesRequest,
} from "../../proto/connect/proto/trading/v1/trading_pb";
import { chromium } from "playwright";
import { ConnectRouter } from "@connectrpc/connect";

export const tradingService =
  (
    router: ConnectRouter
  ) =>
    router.service(
      TradingService,
      {
        async *streamPrices(
          request: StreamPricesRequest
        ) {
          console.log(
            "Client connected, starting to stream prices..."
          );
          const browser =
            await chromium.launch(
              {
                headless:
                  false,
              }
            );
          const page =
            await browser.newPage();
          try {
            const url = `https://www.tradingview.com/symbols/${request.ticker}/?exchange=BINANCE`;
            const scrapPrice =
              await page.goto(
                url,
                {
                  waitUntil:
                    "domcontentloaded",
                }
              );
            if (
              !scrapPrice ||
              scrapPrice.ok() ||
              page.url() !==
                url
            ) {
              throw new Error(
                "Failed to load TradingView page or invalid URL for ticker: " +
                  request.ticker
              );
            }
            while (
              true
            ) {
              const priceText =
                await page.textContent(
                  ".js-symbol-last"
                );
              if (
                !priceText
              )
                throw new Error(
                  `Price not found for "${request.ticker}"`
                );

              const price =
                parseFloat(
                  priceText.replace(
                    /,/g,
                    ""
                  )
                );
              yield {
                ticker:
                  request.ticker,
                price:
                  price,
                change: 0,
                changePercent: 0,
                timestamp:
                  Date.now(),
              };
              await new Promise(
                (
                  r
                ) =>
                  setTimeout(
                    r,
                    2000
                  )
              );
            }
          } catch (error) {
            console.log(
              "Error"
            );
            yield {
              ticker:
                request.ticker,
              price: 0,
              error:
                error instanceof
                Error
                  ? error.message
                  : String(
                      error
                    ),
            };
          } finally {
            await page.close();
            await browser.close();
          }
        },
      }
    );
