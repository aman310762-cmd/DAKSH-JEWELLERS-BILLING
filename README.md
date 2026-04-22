# Daksh Jewellers - Billing & Invoice Management System

A complete, production-ready billing application for **Daksh Jewellers**, a jewellery showroom in Thara, Rajasthan. Built with React, Node.js/Express, and MongoDB.

## 🔗 Quick Start

```bash
# From the project root directory:
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

## ✨ Features

- 📊 **Dashboard** — Business profile, revenue stats, recent invoices, quick actions
- 🧾 **Create Invoice** — Multi-item invoices with live calculation preview
- 👥 **Customer Management** — Add, search, and auto-complete customers
- 📜 **Invoice History** — Search, view details, download PDF, send WhatsApp
- 📄 **PDF Generation** — Professional branded invoices with jsPDF
- 💬 **WhatsApp Integration** — Send invoices via Twilio or WhatsApp Web link
- 🧮 **Jewellery Billing Logic** — Accurate purity-adjusted pricing (24K, 22K, 18K, Silver)

## 📁 Project Structure

```
daksh-jewellers-app/
├── frontend/                  # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/        # Sidebar, PDFGenerator
│   │   ├── pages/             # Dashboard, CreateInvoice, Customers, InvoiceHistory
│   │   ├── api.js             # Axios API client
│   │   ├── billingLogic.js    # Frontend billing calculations
│   │   ├── App.jsx            # Router + layout
│   │   └── index.css          # Tailwind + custom gold theme
│   └── vite.config.js         # Dev server + API proxy
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── config/            # db.js, business.js
│   │   ├── controllers/       # customerController, invoiceController
│   │   ├── models/            # Customer, Invoice (Mongoose schemas)
│   │   ├── routes/            # customerRoutes, invoiceRoutes
│   │   ├── utils/             # billingLogic, inMemoryStore
│   │   └── server.js          # Express entry point
│   └── .env                   # Environment variables
└── package.json               # Root (concurrently for dev)
```

## 🛠️ Installation

### Prerequisites
- Node.js v18+ (installed at `/usr/local/Cellar/node/25.8.2/bin`)
- MongoDB (optional — app works with in-memory storage if unavailable)

### Steps

```bash
# 1. Install all dependencies
cd "Daksh jewellers app"
npm install                   # Root (installs concurrently)
cd backend && npm install     # Backend dependencies
cd ../frontend && npm install # Frontend dependencies
cd ..

# 2. Start both servers
npm run dev
```

## ⚙️ Environment Setup

Edit `backend/.env`:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/daksh-jewellers

# Option A: Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Option B: Meta WhatsApp Cloud API
WHATSAPP_API_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_id
```

> **Note**: Without Twilio credentials, WhatsApp uses `wa.me` links (opens WhatsApp Web with pre-filled message).

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/customer` | Create/update customer |
| GET | `/api/customer` | List customers (with search) |
| GET | `/api/customer/:id` | Get customer by ID |
| POST | `/api/invoice` | Create invoice |
| GET | `/api/invoice` | List invoices (with search) |
| GET | `/api/invoice/:id` | Get invoice by ID |
| POST | `/api/invoice/:id/whatsapp` | Send invoice via WhatsApp |
| GET | `/api/invoice/dashboard` | Dashboard stats |
| GET | `/api/invoice/business` | Business configuration |

## 🧮 Billing Logic

### Purity Standards
| Purity | Factor | Description |
|--------|--------|-------------|
| 24K | 99.9% | Pure Gold |
| 22K | 91.6% | Hallmark Gold |
| 18K | 75.0% | Rose/White Gold |
| Silver | 99.0% | Sterling Silver |

### Calculation Formula
```
Base Price      = Weight × Rate per gram
Adjusted Price  = Base Price × Purity Factor
Taxable Amount  = Adjusted Price + Making Charges
GST             = 3% of Taxable Amount
Total           = Taxable Amount + GST
```

### Example
- **Item**: Gold Necklace, 25.5g, 22K, ₹6,500/g
- **Base Price**: 25.5 × 6,500 = ₹1,65,750.00
- **Adjusted Price**: ₹1,65,750 × 0.916 = ₹1,51,827.00
- **Making Charges**: ₹2,500.00
- **Taxable**: ₹1,54,327.00
- **GST (3%)**: ₹4,629.81
- **Total**: **₹1,58,956.81**

## 💬 WhatsApp Integration

### Option 1: Twilio (Automated)
1. Create a [Twilio account](https://www.twilio.com/)
2. Get Twilio sandbox WhatsApp number
3. Add credentials to `.env`
4. Messages sent automatically via API

### Option 2: WhatsApp Web (Default)
- Works immediately without any setup
- Generates `wa.me` link with pre-filled invoice message
- Opens WhatsApp Web in browser for manual send

## 📄 Sample Test Data

### Customer
- **Name**: Rajesh Kumar
- **Phone**: 9876543210
- **Address**: Main Market, Thara, Rajasthan

### Invoice Item
- **Item**: Gold Necklace
- **Code**: GN-001
- **Weight**: 25.5g
- **Purity**: 22K
- **Rate**: ₹6,500/g
- **Making Charges**: ₹2,500 (fixed)

## 🏢 Business Details (Auto-filled)

- **Name**: Daksh Jewellers
- **Category**: Jewelry Store
- **Location**: Thara, Rajasthan
- **Address**: Near Trehan Society, Bhiwadi, Thara, Rajasthan 301019
- **Hours**: 10:00 AM onwards

These details appear automatically on:
- Dashboard business profile card
- Every invoice header
- Generated PDF invoices

## 🔧 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS v4 |
| Backend | Node.js + Express |
| Database | MongoDB (+ in-memory fallback) |
| PDF | jsPDF + jsPDF-AutoTable |
| WhatsApp | Twilio / wa.me links |
| Icons | Lucide React |
| Notifications | React Hot Toast |

## License

Private — Daksh Jewellers, Thara, Rajasthan
