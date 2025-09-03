# Live Trading Ticker 🚀

Live Trading Ticker is a **fullstack web application** built with **Next.js** on the frontend and **Node.js** on the backend. It leverages **ConnectRPC** for gRPC-style communication, and uses **Playwright** for powerful web scraping capabilities. The project is designed to provide a clean, modular architecture that extracts and tracks live coin prices from http://tradingview.com

---

## 📌 Purpose

The goal of Project Pluto is to demonstrate a production-ready fullstack setup with:
- A **Next.js frontend** for rendering the user-facing application.
- A **Node.js backend** for business logic and API handling.
- **ConnectRPC** for strongly typed and efficient communication between services.
- **Playwright** for automated browser-based scraping, enabling reliable data collection.
- A **run.sh** script to streamline setup, development, and server lifecycle management.

---

## ⚡ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/)  
- **Backend:** [Node.js](https://nodejs.org/) with TypeScript  
- **Communication:** [ConnectRPC](https://connectrpc.com/) (gRPC/Protobuf APIs)  
- **Web Scraping:** [Playwright](https://playwright.dev/)  
- **Package Manager:** [pnpm](https://pnpm.io/)  
- **Proto Codegen:** [Buf](https://buf.build/)  

---

## 🛠️ Setup & Installation

### 1. Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (>= 18.x recommended)  
- [pnpm](https://pnpm.io/) (install globally with `npm install -g pnpm`)  
- [Buf](https://buf.build/) (for gRPC code generation)  

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/live-trading-ticker.git
cd live-trading-ticker && ./run.sh
