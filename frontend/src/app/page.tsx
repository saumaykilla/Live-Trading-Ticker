"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { tradingClient } from "../lib/tradingClient";

interface PriceData {
  ticker: string;
  price: string;
  error?: string;
}

export default function MultiTickerTracker() {
  const [
    clientId,
  ] =
    useState<string>(
      Math.random().toString(
        36
      )
    ); // use a unique ID per session
  const [
    inputTicker,
    setInputTicker,
  ] =
    useState(
      ""
    );
  const [
    tickers,
    setTickers,
  ] =
    useState<
      string[]
    >(
      []
    );
  const [
    priceData,
    setPriceData,
  ] =
    useState<
      PriceData[]
    >(
      []
    );
  const [
    error,
    setError,
  ] =
    useState<
      | string
      | null
    >(
      null
    );

  const boldTickers =
    useRef<
      Set<string>
    >(
      new Set()
    );
  const priceChangeColors =
    useRef<
      Map<
        string,
        | "green"
        | "red"
        | null
      >
    >(
      new Map()
    );

  // Helper: compare prices
  const getPriceChangeColor =
    (
      oldPrice: string,
      newPrice: string
    ) => {
      const oldVal =
        parseFloat(
          oldPrice.replace(
            /[^\d.]/g,
            ""
          )
        );
      const newVal =
        parseFloat(
          newPrice.replace(
            /[^\d.]/g,
            ""
          )
        );
      if (
        isNaN(
          oldVal
        ) ||
        isNaN(
          newVal
        )
      )
        return null;
      if (
        newVal >
        oldVal
      )
        return "green";
      if (
        newVal <
        oldVal
      )
        return "red";
      return null;
    };

  // Start one stream for all tickers
  useEffect(() => {
    let isActive =
      true; // stop stream on unmount
    const abort =
      new AbortController();
    (async () => {
      try {
        const stream =
          tradingClient.streamPrices(
            {
              clientId,
            }
          );

        for await (const res of stream) {
          if (
            !isActive
          )
            break;

          // Remove ticker card on error
          if (
            res.error
          ) {
            setPriceData(
              (
                prev
              ) =>
                prev.filter(
                  (
                    d
                  ) =>
                    d.ticker !==
                    res.ticker
                )
            );
            setTickers(
              (
                prev
              ) =>
                prev.filter(
                  (
                    t
                  ) =>
                    t !==
                    res.ticker
                )
            );
            setError(
              `Error for ${res.ticker}: ${res.error}`
            );
            continue;
          }

          // Clear error when a new ticker is successfully received
          setError(
            null
          );

          setPriceData(
            (
              prev
            ) => {
              const existing =
                prev.find(
                  (
                    d
                  ) =>
                    d.ticker ===
                    res.ticker
                );

              if (
                existing &&
                existing.price !==
                  res.price
              ) {
                // Highlight price changes
                boldTickers.current.add(
                  res.ticker
                );

                const color =
                  getPriceChangeColor(
                    existing.price,
                    res.price
                  );
                if (
                  color
                )
                  priceChangeColors.current.set(
                    res.ticker,
                    color
                  );

                setTimeout(
                  () => {
                    boldTickers.current.delete(
                      res.ticker
                    );
                    priceChangeColors.current.delete(
                      res.ticker
                    );
                  },
                  1000
                );
              }

              return [
                ...prev.filter(
                  (
                    d
                  ) =>
                    d.ticker !==
                    res.ticker
                ),
                {
                  ticker:
                    res.ticker,
                  price:
                    res.price,
                },
              ];
            }
          );
        }
      } catch (err) {
        console.error(
          "Stream error:",
          err
        );
        setError(
          err instanceof
            Error
            ? err.message
            : String(
                err
              )
        );
      }
    })();

    return () => {
      isActive =
        false;
      abort.abort();
    };
  }, [
    clientId,
  ]);

  // Add ticker
  const handleAddTicker =
    useCallback(async () => {
      if (
        !inputTicker.trim()
      )
        return;

      const ticker =
        inputTicker
          .trim()
          .toUpperCase();
      await tradingClient.modifyTickers(
        {
          clientId,
          add: ticker,
          remove:
            "",
        }
      );
      setTickers(
        (
          prev
        ) => [
          ...prev,
          ticker,
        ]
      );
      setInputTicker(
        ""
      );
    }, [
      inputTicker,
      clientId,
    ]);

  // Remove ticker
  const handleRemoveTicker =
    useCallback(
      async (
        ticker: string
      ) => {
        await tradingClient.modifyTickers(
          {
            clientId,
            add: "",
            remove:
              ticker,
          }
        );
        setTickers(
          (
            prev
          ) =>
            prev.filter(
              (
                t
              ) =>
                t !==
                ticker
            )
        );
        setPriceData(
          (
            prev
          ) =>
            prev.filter(
              (
                d
              ) =>
                d.ticker !==
                ticker
            )
        );
      },
      [
        clientId,
      ]
    );

  const handleKeyPress =
    (
      e: React.KeyboardEvent
    ) => {
      if (
        e.key ===
        "Enter"
      )
        handleAddTicker();
    };

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
          Stock
          Price
          Tracker
        </h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={
              inputTicker
            }
            onChange={(
              e
            ) =>
              setInputTicker(
                e
                  .target
                  .value
              )
            }
            onKeyDown={
              handleKeyPress
            }
            placeholder="Enter ticker (e.g., BTCUSDT)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={
              handleAddTicker
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-800">
            {
              error
            }
          </div>
        )}

        {tickers.length >
          0 && (
          <div className="space-y-4">
            {tickers.map(
              (
                ticker
              ) => {
                const latestData =
                  priceData.find(
                    (
                      d
                    ) =>
                      d.ticker ===
                      ticker
                  );
                const isBold =
                  boldTickers.current.has(
                    ticker
                  );
                const priceColor =
                  priceChangeColors.current.get(
                    ticker
                  );

                return (
                  <div
                    key={
                      ticker
                    }
                    className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
                  >
                    <div>
                      <h2 className="text-xl font-bold">
                        {
                          ticker
                        }
                      </h2>
                      {!latestData?.price ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-gray-500">
                            Loading...
                          </span>
                        </div>
                      ) : (
                        <p
                          className={`text-2xl transition-all duration-200 ${
                            isBold
                              ? "font-bold"
                              : "font-normal"
                          } ${
                            priceColor ===
                            "green"
                              ? "text-green-600"
                              : priceColor ===
                                "red"
                              ? "text-red-600"
                              : "text-gray-900"
                          }`}
                        >
                          {
                            latestData.price
                          }
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        handleRemoveTicker(
                          ticker
                        )
                      }
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Remove
                    </button>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
