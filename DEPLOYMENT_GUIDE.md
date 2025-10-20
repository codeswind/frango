# Afkar POS - Deployment Guide

## 📋 Quick Configuration Guide

When deploying to production or changing server URLs, you only need to update **2 files**:

---

## 1️⃣ Backend Configuration
**File:** `api/config.php`

```php
<?php
// ============================================
// API CONFIGURATION
// ============================================

// Database Configuration
define('DB_HOST', 'localhost');        // Change to your database host
define('DB_USER', 'root');             // Change to your database username
define('DB_PASS', 'Abdullah2004*');    // Change to your database password
define('DB_NAME', 'pos_restaurant');   // Change to your database name

// Frontend URL (for CORS)
define('FRONTEND_URL', 'http://localhost:5173');  // Change to your frontend URL

// API Base Path (used for file uploads)
define('API_BASE_PATH', '/Afkar New');  // Change to your API path

// Printer Configuration (for POS terminal)
define('INVOICE_PRINTER', 'XP-80C');         // Change to your invoice printer name
define('KOT_PRINTER', 'XP-80C (copy 1)');    // Change to your KOT printer name
?>
```

### Example Production Settings:
```php
// For production server at domain.com
define('DB_HOST', 'localhost');
define('DB_USER', 'pos_user');
define('DB_PASS', 'your_secure_password');
define('DB_NAME', 'pos_restaurant_live');
define('FRONTEND_URL', 'http://yourdomain.com');
define('API_BASE_PATH', '');  // Root path
```

### Example Network Deployment:
```php
// For POS terminal on local network (192.168.1.100)
define('DB_HOST', '192.168.1.100');
define('DB_USER', 'pos_user');
define('DB_PASS', 'password123');
define('DB_NAME', 'pos_restaurant');
define('FRONTEND_URL', 'http://192.168.1.100:5173');
define('API_BASE_PATH', '/Afkar New');
```

---

## 2️⃣ Frontend Configuration
**File:** `frontend/src/config.js`

```javascript
// ============================================
// FRONTEND CONFIGURATION
// ============================================

// API Configuration
export const API_BASE_URL = 'http://localhost/Afkar New/api';
export const API_BASE_PATH = 'http://localhost/Afkar New';
```

### Example Production Settings:
```javascript
// For production at domain.com
export const API_BASE_URL = 'http://yourdomain.com/api';
export const API_BASE_PATH = 'http://yourdomain.com';
```

### Example Network Deployment:
```javascript
// For POS terminal on local network
export const API_BASE_URL = 'http://192.168.1.100/Afkar New/api';
export const API_BASE_PATH = 'http://192.168.1.100/Afkar New';
```

---

## 🚀 Deployment Steps

### For Localhost Development:
1. No changes needed - default settings work

### For Production Server:
1. Edit `api/config.php` with production database credentials and URL
2. Edit `frontend/src/config.js` with production API URL
3. Upload all files to server
4. Import `pos_restaurant.sql` to production database
5. Build frontend: `npm run build`
6. Deploy built files

### For Network/POS Terminal:
1. Get server IP address (e.g., 192.168.1.100)
2. Update `api/config.php` with server IP
3. Update `frontend/src/config.js` with server IP
4. Access from POS terminal: `http://192.168.1.100/Afkar New`

---

## 🖨️ Printer Configuration

If printer names change, only update in `api/config.php`:

```php
define('INVOICE_PRINTER', 'Your_Invoice_Printer_Name');
define('KOT_PRINTER', 'Your_KOT_Printer_Name');
```

To find your printer names on Windows:
```cmd
wmic printer get name
```

---

## ✅ Verification Checklist

After changing configuration:

- [ ] Backend connects to database
- [ ] Frontend can call API endpoints
- [ ] Images load correctly
- [ ] CORS is working (no errors in browser console)
- [ ] KOT prints to correct printer
- [ ] Invoice prints to correct printer

---

## 📝 Files Using Configuration

### Backend (uses `api/config.php`):
- `api/database.php` - Database connection
- `api/cors.php` - CORS headers
- `api/orders/direct_print_kot.php` - KOT printer
- `api/orders/direct_print_invoice.php` - Invoice printer

### Frontend (uses `frontend/src/config.js`):
- `frontend/src/api/index.js` - API calls
- `frontend/src/pages/CustomerManagement.jsx` - Customer API
- `frontend/src/pages/MenuManagement.jsx` - Menu API & Images
- `frontend/src/pages/Orders.jsx` - Orders API & Images
- `frontend/src/pages/Settings.jsx` - Settings API
- `frontend/src/pages/UserManagement.jsx` - Users API

---

## 🔧 Troubleshooting

### Database connection fails:
- Check `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` in `api/config.php`
- Ensure MySQL service is running

### CORS errors:
- Check `FRONTEND_URL` matches your actual frontend URL
- Include port if using dev server (e.g., `:5173`)

### Images not loading:
- Check `API_BASE_PATH` in `frontend/src/config.js`
- Ensure uploads folder exists and is readable

### Printing not working:
- Check printer names in `api/config.php`
- Ensure printers are shared on Windows
- Run: `wmic printer get name` to verify exact names

---

## 💡 Quick Reference

| Environment | Backend Config | Frontend Config |
|-------------|---------------|-----------------|
| **Localhost** | `localhost` | `http://localhost/Afkar New` |
| **Production** | Your DB host | `http://yourdomain.com` |
| **Network** | Server IP | `http://192.168.1.X` |

---

**That's it! Only 2 files to change for deployment.** 🎉
