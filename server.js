require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/invbill.db';

// Ensure data dir
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let db;
try {
  db = new Database(DB_PATH, { verbose: null });
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

// ==================== DATABASE SCHEMA ====================
function initDatabase() {
  try {
    db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      barcode TEXT,
      cost_price REAL DEFAULT 0,
      mrp REAL DEFAULT 0,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id TEXT NOT NULL,
      product_id TEXT,
      name TEXT,
      qty INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exchanges (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      original_invoice_id TEXT,
      customer_name TEXT,
      total_refund REAL,
      reason TEXT
    );

    CREATE TABLE IF NOT EXISTS held_carts (
      id TEXT PRIMARY KEY,
      name TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      cart_data TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Runtime migration for multi-user (cashier attribution on invoices)
  try { db.exec("ALTER TABLE invoices ADD COLUMN cashier TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE held_carts ADD COLUMN held_by TEXT"); } catch (e) {}

  // Seed default admin if none
  const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get(process.env.ADMIN_DEFAULT_USER || 'admin');
  if (!adminUser) {
    const hash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASS || 'admin123', 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(
      process.env.ADMIN_DEFAULT_USER || 'admin',
      hash
    );
    console.log('Default admin created: admin / admin123');
  }

  // Seed default shop settings
  const shopName = db.prepare("SELECT value FROM settings WHERE key = 'shop_name'").get();
  if (!shopName) {
    const defaults = {
      shop_name: 'InvBill Store',
      owner: 'Alex',
      address: '123 Market Road, New Delhi - 110001',
      phone: '+91 98765 43210',
      gstin: '07AABCU9603R1ZM'
    };
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(defaults)) {
      stmt.run(k, v);
    }
  }
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

// Helper to get all settings as object
function getShopSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  return {
    name: obj.shop_name || 'InvBill Store',
    owner: obj.owner || 'Alex',
    address: obj.address || '',
    phone: obj.phone || '',
    gstin: obj.gstin || ''
  };
}

function saveShopSettings(newSettings) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  if (newSettings.name) stmt.run('shop_name', newSettings.name);
  if (newSettings.owner) stmt.run('owner', newSettings.owner);
  if (newSettings.address) stmt.run('address', newSettings.address);
  if (newSettings.phone) stmt.run('phone', newSettings.phone);
  if (newSettings.gstin) stmt.run('gstin', newSettings.gstin);
}

// Seed demo data if products empty
function seedDemoDataIfNeeded() {
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  if (count > 0) return;

  const demoProducts = [
    { id: 'p1', sku: 'ELC-001', name: 'Wireless Earbuds', category: 'Electronics', barcode: '8901234567890', costPrice: 32, mrp: 69, price: 49.99, stock: 32, minStock: 10, unit: 'pcs' },
    { id: 'p2', sku: 'ELC-002', name: 'USB-C Cable (2m)', category: 'Electronics', barcode: '8901234567906', costPrice: 6, mrp: 19, price: 12.50, stock: 87, minStock: 25, unit: 'pcs' },
    { id: 'p3', sku: 'HME-101', name: 'Ceramic Coffee Mug', category: 'Home & Kitchen', barcode: '8901234567937', costPrice: 4.5, mrp: 15, price: 8.99, stock: 4, minStock: 15, unit: 'pcs' },
    { id: 'p4', sku: 'STN-045', name: 'A5 Notebook (Pack of 3)', category: 'Stationery', barcode: '8901234567913', costPrice: 3.2, mrp: 12, price: 6.75, stock: 120, minStock: 40, unit: 'pack' },
    { id: 'p5', sku: 'ELC-015', name: 'Portable Power Bank 20000mAh', category: 'Electronics', barcode: '8901234567944', costPrice: 18, mrp: 45, price: 29.99, stock: 19, minStock: 8, unit: 'pcs' },
    { id: 'p6', sku: 'HME-210', name: 'Stainless Steel Water Bottle', category: 'Home & Kitchen', barcode: '8901234567951', costPrice: 8, mrp: 25, price: 14.50, stock: 27, minStock: 12, unit: 'pcs' },
    { id: 'p7', sku: 'GRY-007', name: 'Organic Almonds 500g', category: 'Groceries', barcode: '8901234567920', costPrice: 4.5, mrp: 12, price: 7.25, stock: 53, minStock: 20, unit: 'pcs' },
    { id: 'p8', sku: 'STN-009', name: 'Ballpoint Pen Set (12 pcs)', category: 'Stationery', barcode: '8901234567968', costPrice: 2.2, mrp: 9, price: 4.99, stock: 9, minStock: 30, unit: 'pack' }
  ];

  const insert = db.prepare(`
    INSERT INTO products (id, sku, name, category, barcode, cost_price, mrp, price, stock, min_stock, unit)
    VALUES (@id, @sku, @name, @category, @barcode, @costPrice, @mrp, @price, @stock, @minStock, @unit)
  `);

  const insertMany = db.transaction((products) => {
    for (const p of products) insert.run(p);
  });
  insertMany(demoProducts);
  console.log('Demo products seeded.');
}

initDatabase();
seedDemoDataIfNeeded();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve the frontend (index.html and all static files from this folder)
app.use(express.static(__dirname));

// Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ==================== AUTH ====================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid username or password' });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid username or password' });

    // Create a fresh token for this device/session (supports multiple devices per user)
    const token = generateToken();
    const role = (user.username === 'admin') ? 'admin' : 'cashier';
    activeSessions.set(token, { username: user.username, role, loginAt: Date.now() });

    res.json({ 
      success: true, 
      token, 
      user: { username: user.username, role } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/change-password', (req, res) => {
  const { username, currentPassword, newPassword, newUsername } = req.body;
  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !user.password_hash || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password incorrect' });
    }

    const targetUser = newUsername && newUsername !== username ? newUsername : username;

    // If renaming username, check if target exists
    if (targetUser !== username) {
      const exists = db.prepare('SELECT 1 FROM users WHERE username = ?').get(targetUser);
      if (exists) return res.status(400).json({ error: 'Username already taken' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);

    if (targetUser !== username) {
      db.prepare('DELETE FROM users WHERE username = ?').run(username);
      db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(targetUser, newHash);
    } else {
      db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(newHash, username);
    }

    res.json({ success: true, message: 'Credentials updated' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protect data routes with authentication (required for multi-device / multi-user)
app.use(['/api/products', '/api/invoices', '/api/held-carts', '/api/exchanges', '/api/settings', '/api/dashboard', '/api/users'], authRequired);

// ==================== USER MANAGEMENT (admin only, for multi-cashier stores) ====================
app.get('/api/users', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const users = db.prepare('SELECT username FROM users ORDER BY username').all();
    res.json(users.map(u => ({ username: u.username })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.post('/api/users', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const exists = db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
    if (exists) return res.status(409).json({ error: 'User already exists' });

    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
    res.status(201).json({ success: true, username });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.delete('/api/users/:username', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { username } = req.params;
  if (username === 'admin') return res.status(400).json({ error: 'Cannot delete the last admin' });
  try {
    const result = db.prepare('DELETE FROM users WHERE username = ?').run(username);
    res.json({ success: result.changes > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== PRODUCTS ====================
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY name').all();
    const mapped = products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      barcode: p.barcode,
      costPrice: p.cost_price,
      mrp: p.mrp,
      price: p.price,
      stock: p.stock,
      minStock: p.min_stock,
      unit: p.unit,
      description: p.description
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const p = req.body;
    if (!p.name || !p.sku || !p.price) {
      return res.status(400).json({ error: 'name, sku and price are required' });
    }

    const id = p.id || 'p' + Date.now();
    db.prepare(`
      INSERT INTO products (id, sku, name, category, barcode, cost_price, mrp, price, stock, min_stock, unit, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, p.sku, p.name, p.category || '', p.barcode || '',
      p.costPrice || 0, p.mrp || 0, p.price, p.stock || 0, p.minStock || 0,
      p.unit || 'pcs', p.description || ''
    );
    broadcast({ type: 'data-changed', entities: ['products'] });
    res.status(201).json({ id, ...p });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    console.error('Create product error:', e);
    res.status(500).json({ error: e.message || 'Failed to create product' });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    const result = db.prepare(`
      UPDATE products SET
        sku = ?, name = ?, category = ?, barcode = ?,
        cost_price = ?, mrp = ?, price = ?, stock = ?,
        min_stock = ?, unit = ?, description = ?
      WHERE id = ?
    `).run(
      p.sku, p.name, p.category, p.barcode,
      p.costPrice, p.mrp, p.price, p.stock,
      p.minStock, p.unit, p.description, id
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
    broadcast({ type: 'data-changed', entities: ['products'] });
    res.json({ success: true });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    broadcast({ type: 'data-changed', entities: ['products'] });
    res.json({ success: result.changes > 0 });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.post('/api/products/:id/adjust-stock', (req, res) => {
  try {
    const { id } = req.params;
    const { change } = req.body;
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    const newStock = Math.max(0, product.stock + (change || 0));
    db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(newStock, id);
    broadcast({ type: 'data-changed', entities: ['products'] });
    res.json({ stock: newStock });
  } catch (err) {
    console.error('Adjust stock error:', err);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// ==================== INVOICES ====================
function generateInvoiceId() {
  const date = new Date();
  const today = date.toISOString().slice(0, 10); // '2026-05-22'
  const count = db.prepare("SELECT COUNT(*) as c FROM invoices WHERE date LIKE ?").get(today + '%').c + 1;
  const idDate = today.replace(/-/g, ''); // '20260522'
  return `INV-${idDate}-${String(count).padStart(3, '0')}`;
}

app.get('/api/invoices', (req, res) => {
  try {
    const invoices = db.prepare('SELECT * FROM invoices ORDER BY date DESC').all();
    const itemsStmt = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');

    const full = invoices.map(inv => {
      const items = itemsStmt.all(inv.id).map(it => ({
        productId: it.product_id,
        name: it.name,
        qty: it.qty,
        price: it.price
      }));
      return {
        id: inv.id,
        date: (inv.date || '').split('T')[0],
        customerName: inv.customer_name,
        customerPhone: inv.customer_phone,
        items,
        subtotal: inv.subtotal,
        tax: inv.tax,
        discount: inv.discount,
        total: inv.total,
        paymentMethod: inv.payment_method,
        notes: inv.notes,
        cashier: inv.cashier || null
      };
    });
    res.json(full);
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.post('/api/invoices', (req, res) => {
  try {
    const sale = req.body;
    if (!sale.items || sale.items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    const invoiceId = generateInvoiceId();
    const dateStr = new Date().toISOString().split('T')[0];

    const insertInvoice = db.prepare(`
      INSERT INTO invoices (id, date, customer_name, customer_phone, subtotal, tax, discount, total, payment_method, notes, cashier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, product_id, name, qty, price)
      VALUES (?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');

    const tx = db.transaction(() => {
      const cashierName = (req.user && req.user.username) || sale.cashier || 'Staff';
      insertInvoice.run(
        invoiceId, dateStr, sale.customerName || 'Walk-in', sale.customerPhone || '',
        sale.subtotal || 0, sale.tax || 0, sale.discount || 0, sale.total, sale.paymentMethod || 'cash', sale.notes || '', cashierName
      );

      for (const item of sale.items) {
        insertItem.run(invoiceId, item.productId || null, item.name, item.qty, item.price);

        if (item.productId) {
          const updated = updateStock.run(item.qty, item.productId, item.qty);
          if (updated.changes === 0) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
        }
      }
    });

    tx();
    broadcast({ type: 'data-changed', entities: ['invoices', 'products'] });
    res.status(201).json({ id: invoiceId, success: true });
  } catch (e) {
    console.error('Create invoice error:', e);
    res.status(400).json({ error: e.message || 'Failed to create invoice' });
  }
});

app.get('/api/invoices/:id', (req, res) => {
  try {
    const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id);
    inv.items = items.map(i => ({ productId: i.product_id, name: i.name, qty: i.qty, price: i.price }));
    res.json(inv);
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// ==================== HELD CARTS ====================
app.get('/api/held-carts', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM held_carts ORDER BY created_at DESC').all();
    const carts = rows.map(r => ({
      id: r.id,
      name: r.name,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      cart: JSON.parse(r.cart_data || '[]')
    }));
    res.json(carts);
  } catch (err) {
    console.error('Get held carts error:', err);
    res.status(500).json({ error: 'Failed to fetch held carts' });
  }
});

app.post('/api/held-carts', (req, res) => {
  try {
    const h = req.body;
    const id = h.id || Date.now();
    db.prepare(`
      INSERT OR REPLACE INTO held_carts (id, name, customer_name, customer_phone, cart_data)
      VALUES (?, ?, ?, ?, ?)
    `    ).run(id, h.name, h.customerName || '', h.customerPhone || '', JSON.stringify(h.cart || []));
    broadcast({ type: 'data-changed', entities: ['held-carts'] });
    res.json({ id, success: true });
  } catch (err) {
    console.error('Save held cart error:', err);
    res.status(500).json({ error: 'Failed to save cart' });
  }
});

app.delete('/api/held-carts/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM held_carts WHERE id = ?').run(req.params.id);
    broadcast({ type: 'data-changed', entities: ['held-carts'] });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete held cart error:', err);
    res.status(500).json({ error: 'Failed to delete cart' });
  }
});

// ==================== EXCHANGES (minimal) ====================
app.get('/api/exchanges', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM exchanges ORDER BY date DESC').all();
    res.json(rows.map(r => ({
      id: r.id,
      date: (r.date || '').split('T')[0],
      originalInvoiceId: r.original_invoice_id,
      customerName: r.customer_name,
      totalRefund: r.total_refund,
      reason: r.reason
    })));
  } catch (err) {
    console.error('Get exchanges error:', err);
    res.status(500).json({ error: 'Failed to fetch exchanges' });
  }
});

app.post('/api/exchanges', (req, res) => {
  try {
    const e = req.body;
    const id = e.id || 'EX-' + Date.now();
    const dateStr = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO exchanges (id, date, original_invoice_id, customer_name, total_refund, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, dateStr, e.originalInvoiceId || '', e.customerName || '', e.totalRefund || 0, e.reason || '');
    res.json({ id, success: true });
  } catch (err) {
    console.error('Create exchange error:', err);
    res.status(500).json({ error: 'Failed to create exchange' });
  }
});

// ==================== SETTINGS ====================
app.get('/api/settings', (req, res) => {
  try {
    res.json(getShopSettings());
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    saveShopSettings(req.body);
    res.json({ success: true, settings: getShopSettings() });
  } catch (err) {
    console.error('Save settings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ==================== DASHBOARD STATS (convenience) ====================
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
    const inventoryValue = db.prepare('SELECT SUM(stock * price) as v FROM products').get().v || 0;
    const today = new Date().toISOString().slice(0,10);
    const todaySales = db.prepare("SELECT SUM(total) as s FROM invoices WHERE date LIKE ?").get(today + '%').s || 0;
    const lowStock = db.prepare('SELECT COUNT(*) as c FROM products WHERE stock <= min_stock').get().c;
    const totalRevenue = db.prepare('SELECT SUM(total) as t FROM invoices').get().t || 0;

    res.json({
      totalProducts,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      todaySales: Math.round(todaySales * 100) / 100,
      lowStock,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ==================== HEALTH ====================
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Helper: get LAN IPs for multi-device / multi-terminal use
function getLocalIPs() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

// ==================== START ====================
// Capture server for WebSocket attachment (Phase 2) and improved multi-device logging (Phase 1)
const server = app.listen(PORT, () => {
  const ips = getLocalIPs();
  console.log(`\n🚀 InvBill Multi-Terminal POS`);
  console.log(`   Local:   http://localhost:${PORT}`);
  if (ips.length > 0) {
    ips.forEach(ip => {
      console.log(`   Network: http://${ip}:${PORT}   ← open this from other devices in the store`);
    });
  } else {
    console.log(`   (No non-internal IPv4 interfaces detected — use localhost for testing)`);
  }
  console.log(`   API base: http://localhost:${PORT}/api`);
  console.log(`   Default admin: admin / admin123 (change immediately!)`);
  console.log(`   DB file: ${path.resolve(DB_PATH)}\n`);
  console.log(`   Tip: On other devices (tablets/phones/laptops on same Wi-Fi) open one of the Network URLs above.`);
});

// ==================== WEBSOCKET (real-time for multi-device) ====================
// Created here so broadcast() can be called from any route handler
const wss = new WebSocket.Server({ server });

function broadcast(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Basic connection logging (auth token check added in Phase 3)
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected from', req.socket.remoteAddress);
  ws.on('close', () => console.log('WebSocket client disconnected'));
});

// ==================== SIMPLE TOKEN SESSIONS (in-memory for multi-user/multi-device) ====================
// Tokens are returned on login and sent in Authorization: Bearer <token> or ?token= for WS
const activeSessions = new Map(); // token -> { username, role: 'admin'|'cashier', loginAt }

function generateToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

function getUserFromToken(token) {
  if (!token) return null;
  return activeSessions.get(token) || null;
}

// Express middleware: protects routes. Attaches req.user
function authRequired(req, res, next) {
  // Support "Authorization: Bearer xxx" (normal) or ?token=xxx (for WebSocket initial page load / testing)
  let token = null;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  const user = getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  req.user = user; // { username, role, loginAt }
  next();
}

