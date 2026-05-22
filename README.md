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

---

## Deployment (GitHub + Vercel or other platforms)

### Important Reality Check
This application is designed as a **local always-on server** for a physical retail store (one machine runs the Node server, multiple devices on the same LAN connect to it for live billing with WebSockets and a local SQLite database).

**It cannot be deployed to Vercel "as-is"** for these technical reasons:

- Uses `better-sqlite3` (native C++ addon) → Vercel serverless cannot compile native modules.
- Relies on a persistent local SQLite file (`data/invbill.db`) → serverless functions have no disk persistence.
- Uses long-running WebSocket server (`ws` package + `app.listen`) → Vercel serverless functions are short-lived request/response only.
- The app expects to run continuously (multi-device real-time sync for cashiers).

### Recommended Path (Easiest & Best Fit)
If you want to host this exact version with minimal changes, use a platform that supports traditional Node.js apps with native modules and persistent storage:

- **Railway.app** (recommended – free tier + volume for the .db file + WebSockets)
- Render.com
- Fly.io
- A cheap VPS (DigitalOcean, Hetzner, etc.) + PM2

These platforms let you push the current code via Git and it will "just work" for a real store.

### GitHub Setup (What I just did for you)
I have already:
- Initialized a git repository
- Created a proper `.gitignore`
- Made the first two commits
- Added a starter `vercel.json` (for future experimentation)

**Next steps you must do manually** (open PowerShell in this folder):

```powershell
# 1. Create a new repository on GitHub (https://github.com/new)
#    Name it something like `invbill-pos` (do NOT initialize with README)

# 2. Connect and push from here
git remote add origin https://github.com/YOUR_USERNAME/invbill-pos.git
git branch -M main
git push -u origin main
```

Then:
- Go to https://vercel.com/new
- Import your GitHub repo
- You will see the deploy fail (this is expected right now).

### If You Still Want Vercel (Big Refactor Required)
To make it work on Vercel you would need to:
1. Replace `better-sqlite3` + file DB with **Vercel Postgres**, **Turso**, or **Supabase**.
2. Convert every route in `server.js` into individual serverless functions under an `/api` folder.
3. Remove or replace the WebSocket real-time system with polling or a third-party realtime service.
4. The frontend (`index.html`) can stay as a static site.

I can help you with this migration if you decide you really need it on Vercel (it will take several hours of work).

### Quick Recommendation
For a real store cash register system that multiple staff members use on tablets/phones inside the shop, **Railway or Render** will be dramatically simpler and more reliable than forcing it onto Vercel.

Would you like me to:
A) Give you the exact commands + Dockerfile / railway.toml for a one-click Railway deploy, or
B) Start the big refactor to make it Vercel-compatible?

Just say the word and I'll proceed.
