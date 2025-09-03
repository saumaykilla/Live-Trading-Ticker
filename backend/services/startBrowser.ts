import {
  chromium,
  Browser,
} from "playwright";

let browser: Browser | null =
  null;

export const getBrowser =
  async () => {
    if (
      !browser
    ) {
      browser =
        await chromium.launch(
          {
            headless:
              true,
          }
        ); // or false if you want visible
      console.log(
        "✅ Browser launched and kept alive"
      );
    }
    return browser;
  };

process.on(
  "exit",
  async () => {
    if (
      browser
    ) {
      await browser.close();
      console.log(
        "🛑 Browser closed on exit"
      );
    }
  }
);
