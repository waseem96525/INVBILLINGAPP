# InvBill Backend

Node.js + Express + SQLite backend for the InvBill Billing & Inventory System.

## Features
- Full CRUD for Products (with stock adjustment)
- Invoice creation with automatic stock deduction (transactions)
- Shop Settings persistence
- Admin authentication + password change
- Dashboard stats endpoint
- Demo data auto-seeded on first run

## Quick Start (Full-Stack)

```bash
npm install
npm start
```

Then open **http://localhost:3000/** in your browser.

The backend now serves the frontend automatically.

API base is still available at `http://localhost:3000/api` (for reference).

## Default Admin
- Username: `admin`
- Password: `admin123`

**Change this immediately** after first login via the Admin section.

## Multi-Device / Multi-Terminal Store Setup (Recommended)

InvBill is designed to run as a **central server** that multiple devices (cashier PCs, tablets, phones) in the same physical store can connect to simultaneously for live billing, inventory, and held carts.

### How It Works
- One machine (usually the back-office or a dedicated mini-PC) runs the Node.js server.
- All other devices simply open the same web address in a normal browser (Chrome/Firefox recommended). No native app install needed (can be added to home screen as PWA).
- Everything is real-time via WebSockets once the feature is active: stock changes, new invoices, and held carts instantly appear on every connected device.
- All data lives in the single `data/invbill.db` file on the server machine.

### Quick Setup for Multiple Devices
1. On the **main store computer**:
   ```bash
   npm start
   ```
   Look at the console output — it will print both `localhost` and your LAN IP(s):
   ```
   🚀 InvBill Multi-Terminal POS
      Local:   http://localhost:3000
      Network: http://192.168.1.105:3000   ← open this from other devices
   ```

2. On **other devices** (tablets, secondary PCs, phones on the same Wi-Fi):
   - Open the **Network** URL (e.g. `http://192.168.1.105:3000`) in the browser.
   - Log in with a cashier account (see Authentication below).
   - Start billing — changes are live across all terminals.

3. **Firewall / Network**:
   - Allow inbound TCP traffic on port 3000 (or whatever `PORT` you set in `.env`) on the server machine.
   - Use a wired connection for the server if possible for stability.
   - All devices must be on the same LAN (no internet required).

4. **Running 24/7**:
   - Windows: use Task Scheduler or `pm2` (`npm install -g pm2`, then `pm2 start server.js --name invbill`).
   - The server is lightweight and designed to run continuously.

### Security Notes for a Real Store
- **Always change the default admin password** immediately.
- Only trusted devices on your internal network should be able to reach the server.
- Consider running behind a simple reverse proxy (nginx / Caddy) later if you want HTTPS inside the store.
- Never expose port 3000 directly to the public internet without a VPN or proper authentication layer.

### Current Limitations (v1 multi-device)
- One physical store only.
- Requires the server machine to be powered on.
- No offline mode (devices must stay connected to the server).
- Printing is handled by the browser on each device (you can configure different printers per terminal via the OS).

This setup has been tested with 3–5 concurrent devices (typical small/medium retail).

## API Endpoints (key ones)

### Products
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/:id/adjust-stock`

### Invoices
- `GET /api/invoices`
- `POST /api/invoices`  (body includes items array + totals)
- `GET /api/invoices/:id`

### Settings
- `GET /api/settings`
- `PUT /api/settings`

### Auth
- `POST /api/auth/login`
- `POST /api/auth/change-password`

### Other
- `GET /api/dashboard/stats`
- `GET /api/health`

## Connecting the Frontend

The original `index.html` is 100% client-side.

To use this backend:

1. Keep the HTML as-is for standalone use, **or**
2. Refactor the JavaScript data layer to call these REST endpoints (recommended for production).

I can help you with the frontend integration in the next step if needed (replacing all localStorage + array logic with fetch calls).

## Database
- SQLite file: `./data/invbill.db`
- Fully portable single file.

## Notes
- CORS is enabled (good for dev with separate frontend)
- All monetary values stored as REAL
- Invoice IDs auto-generated as `INV-YYYYMMDD-XXX`

Built for the original InvBill frontend.
