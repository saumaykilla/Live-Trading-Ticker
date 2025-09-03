import {
  TradingService,
  StreamPricesRequest,
  ModifyTickersRequest,
  ModifyTickersResponse,
} from "../../proto/connect/proto/trading/v1/trading_pb";
import { ConnectRouter } from "@connectrpc/connect";
import { getBrowser } from "./startBrowser";

const activeClients =
  new Map<
    string,
    Set<string>
  >();

// Abortable sleep helper
function sleep(
  ms: number,
  signal: AbortSignal
) {
  return new Promise<void>(
    (
      resolve,
      reject
    ) => {
      const timeout =
        setTimeout(
          resolve,
          ms
        );
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(
            timeout
          );
          reject(
            new Error(
              "Sleep aborted"
            )
          );
        }
      );
    }
  );
}

// Process a single ticker and return price data
async function processTicker(
  ticker: string,
  browser: any,
  signal: AbortSignal
): Promise<{
  ticker: string;
  price?: string;
  error?: string;
}> {
  const page =
    await browser.newPage();

  try {
    const url = `https://www.tradingview.com/symbols/${ticker}/?exchange=BINANCE`;

    // Abortable navigation
    const gotoPromise =
      page.goto(
        url,
        {
          waitUntil:
            "domcontentloaded",
        }
      );
    const abortPromise =
      new Promise<never>(
        (
          _,
          reject
        ) => {
          signal.addEventListener(
            "abort",
            () =>
              reject(
                new Error(
                  "Navigation aborted"
                )
              )
          );
        }
      );

    await Promise.race(
      [
        gotoPromise,
        abortPromise,
      ]
    );

    if (
      signal.aborted
    ) {
      return {
        ticker,
        error:
          "Request aborted",
      };
    }

    await page.waitForSelector(
      ".js-symbol-last",
      {
        timeout: 5000,
      }
    );

    const [
      price,
      currency,
    ] =
      await Promise.all(
        [
          page.$eval(
            ".js-symbol-last",
            (
              el: HTMLElement
            ) =>
              el.textContent?.trim()
          ),
          page.$eval(
            ".js-symbol-currency",
            (
              el: HTMLElement
            ) =>
              el.textContent?.trim()
          ),
        ]
      );

    return {
      ticker,
      price: `${price} ${currency}`,
    };
  } catch (error: any) {
    return {
      ticker,
      error:
        "This ticker does not exist on BINANCE or failed to load",
    };
  } finally {
    try {
      await page.close();
    } catch (e) {
      console.error(
        "Error closing page:",
        e
      );
    }
  }
}

// Process all tickers in parallel and yield results as they complete
async function* processTickersInParallel(
  tickers: Set<string>,
  browser: any,
  signal: AbortSignal
) {
  if (
    tickers.size ===
    0
  )
    return;

  // Create promises for all tickers
  const tickerPromises =
    Array.from(
      tickers
    ).map(
      async (
        ticker
      ) => {
        try {
          const result =
            await processTicker(
              ticker,
              browser,
              signal
            );
          return result;
        } catch (error) {
          return {
            ticker,
            error:
              "Failed to process ticker",
          };
        }
      }
    );

  // Use Promise.allSettled to handle individual failures
  // and yield results as they complete
  const results =
    await Promise.allSettled(
      tickerPromises
    );

  for (const result of results) {
    if (
      result.status ===
        "fulfilled" &&
      !signal.aborted
    ) {
      yield result.value;
    }
  }
}

export const tradingService =
  (
    router: ConnectRouter
  ) =>
    router.service(
      TradingService,
      {
        async *streamPrices(
          request: StreamPricesRequest,
          ctx
        ) {
          const clientId =
            request.clientId;
          if (
            !clientId
          ) {
            console.log(
              "streamPrices: Missing clientId"
            );
            return;
          }

          if (
            !activeClients.has(
              clientId
            )
          ) {
            activeClients.set(
              clientId,
              new Set()
            );
            console.log(
              `streamPrices: New client connected: ${clientId}`
            );
          }

          const tickers =
            activeClients.get(
              clientId
            )!;
          console.log(
            `streamPrices: Current tickers for ${clientId}:`,
            [
              ...tickers,
            ]
          );

          const browser =
            await getBrowser();

          // Cleanup if client disconnects
          ctx.signal.addEventListener(
            "abort",
            async () => {
              console.log(
                `streamPrices: Client ${clientId} disconnected`
              );
              activeClients.delete(
                clientId
              );
            }
          );

          try {
            while (
              !ctx
                .signal
                .aborted
            ) {
              // Process all tickers in parallel and yield results as they come
              for await (const result of processTickersInParallel(
                tickers,
                browser,
                ctx.signal
              )) {
                if (
                  ctx
                    .signal
                    .aborted
                )
                  break;

                // Remove ticker if there was an error
                if (
                  result.error
                ) {
                  tickers.delete(
                    result.ticker
                  );
                }

                console.log(
                  `${
                    result.ticker
                  } ${
                    result.price ||
                    result.error
                  }`
                );
                yield result;
              }

              if (
                ctx
                  .signal
                  .aborted
              )
                break;

              // Wait before next batch (abortable)
              try {
                await sleep(
                  1000,
                  ctx.signal
                );
              } catch (err) {
                break;
              }
            }
          } finally {
            console.log(
              `streamPrices: Stream ended for client ${clientId}`
            );
          }
        },

        async modifyTickers(
          req: ModifyTickersRequest
        ): Promise<ModifyTickersResponse> {
          const {
            clientId,
            add,
            remove,
          } =
            req;
          if (
            !clientId
          ) {
            console.log(
              "modifyTickers: Missing clientId"
            );
            return {
              $typeName:
                "proto.trading.v1.ModifyTickersResponse",
              success:
                false,
            };
          }

          if (
            !activeClients.has(
              clientId
            )
          ) {
            activeClients.set(
              clientId,
              new Set()
            );
            console.log(
              `modifyTickers: New client added: ${clientId}`
            );
          }

          const tickers =
            activeClients.get(
              clientId
            )!;

          if (
            add
          ) {
            tickers.add(
              add.toUpperCase()
            );
            console.log(
              `modifyTickers: Added ticker for ${clientId}: ${add.toUpperCase()}`
            );
          }

          if (
            remove
          ) {
            tickers.delete(
              remove.toUpperCase()
            );
            console.log(
              `modifyTickers: Removed ticker for ${clientId}: ${remove.toUpperCase()}`
            );
          }

          console.log(
            `modifyTickers: Current tickers for ${clientId}:`,
            [
              ...tickers,
            ]
          );

          return {
            $typeName:
              "proto.trading.v1.ModifyTickersResponse",
            success:
              true,
          };
        },
      }
    );
