# Environment Variables Setup

**Project:** WindPOS Restaurant Management System
**Company:** CodesWind
**Date:** 2025-10-28

---

## Overview

WindPOS now uses environment variables (`.env` files) for configuration. This is a **security best practice** that:

- ✅ Keeps sensitive credentials out of version control
- ✅ Allows different configs for dev/staging/production
- ✅ Makes deployment easier
- ✅ Follows industry standards

---

## Setup Instructions

### 1. Backend (API)

**Location:** `api/.env`

**Already configured!** Your backend `.env` file contains:

```ini
; Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=pos_restaurant

; Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

; API Base Path (used for file uploads)
API_BASE_PATH="/Afkar New"

; Printer Configuration
INVOICE_PRINTER="XP-80C"
KOT_PRINTER="XP-80C (copy 1)"
```

**Note:** Uses semicolon (`;`) for comments (PHP `parse_ini_file` format)

---

### 2. Frontend (React + Vite)

**Location:** `frontend/.env`

**Already configured!** Your frontend `.env` file contains:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost/Afkar New/api
VITE_API_BASE_PATH=http://localhost/Afkar New
```

**Important:**
- Vite requires `VITE_` prefix for all custom environment variables
- Restart dev server after changing `.env` file
- Access via `import.meta.env.VITE_VARIABLE_NAME`

---

## For Development

### Starting the App

1. **Backend** - Already running on Apache (XAMPP)
2. **Frontend** - Run from `frontend/` directory:
   ```bash
   npm run dev
   ```

The frontend dev server will automatically load `.env` file.

---

## For Production Deployment

### 1. Create Production Environment Files

**Backend** (`api/.env`):
```ini
; Database Configuration
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASS=your_strong_password
DB_NAME=pos_restaurant

; Frontend URL (for CORS)
FRONTEND_URL=https://yourwebsite.com

; API Base Path
API_BASE_PATH="/api"

; Printer Configuration
INVOICE_PRINTER="Your_Printer_Name"
KOT_PRINTER="Your_KOT_Printer_Name"
```

**Frontend** (`frontend/.env.production`):
```bash
# Production API Configuration
VITE_API_BASE_URL=https://yourwebsite.com/api
VITE_API_BASE_PATH=https://yourwebsite.com
```

### 2. Build Frontend

```bash
cd frontend
npm run build
```

This creates optimized production files in `frontend/dist/`

### 3. Deploy

- Upload `api/` folder to your server
- Upload `frontend/dist/` contents to your web root
- Ensure `.env` files are **NOT** uploaded (use `.env.example` as template)
- Create fresh `.env` files on the server with production values

---

## Security Checklist

- [x] `.env` files excluded from Git (via `.gitignore`)
- [x] `.env.example` files provided as templates
- [x] No sensitive data in source code
- [x] Backend uses `;` for comments (PHP ini format)
- [x] Frontend uses `#` for comments (Vite format)
- [x] All variables prefixed with `VITE_` in frontend

---

## File Structure

```
Afkar New/
├── api/
│   ├── .env                    # Backend config (IGNORED by Git)
│   └── .env.example           # Template for backend
│
├── frontend/
│   ├── .env                   # Frontend config (IGNORED by Git)
│   ├── .env.example          # Template for frontend
│   ├── .env.production       # Production config (IGNORED by Git)
│   └── src/
│       └── config.js         # Reads from .env
│
└── .gitignore                # Excludes all .env files
```

---

## Example: Changing API URL

### For Local Development

Edit `frontend/.env`:
```bash
VITE_API_BASE_URL=http://localhost/Afkar New/api
```

### For Production

Edit `frontend/.env.production`:
```bash
VITE_API_BASE_URL=https://yourwebsite.com/api
```

Then rebuild:
```bash
npm run build
```

---

## Troubleshooting

### Issue: "Environment variable not found"

**Solution:**
1. Ensure variable is prefixed with `VITE_` in frontend
2. Restart dev server after changing `.env`
3. Clear browser cache

### Issue: "CORS error" after changing FRONTEND_URL

**Solution:**
1. Update `FRONTEND_URL` in `api/.env`
2. Restart Apache (XAMPP)

### Issue: ".env file not found"

**Solution:**
1. Copy `.env.example` to `.env`
2. Fill in your values
3. Never commit `.env` to Git

---

## Support

For configuration issues:
- **Company:** CodesWind
- **Phone:** 0722440666
- **Website:** codeswind.cloud

---

**Last Updated:** 2025-10-28
**Version:** 1.0
