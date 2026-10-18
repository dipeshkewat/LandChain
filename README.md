# ??? LandChain — Blockchain-Based Land Registry System

> **A modern, tamper-evident land registry and property title management system powered by Ethereum Smart Contracts, SHA-256 cryptographic document verification, PostgreSQL (Neon Cloud), Express REST API (Render), and React (Netlify).**

---

## ?? Live Deployment

| Service | Component | Live Link |
|---|---|---|
| ??? **Frontend** | React 19 + Vite SPA | [https://landchainss.netlify.app](https://landchainss.netlify.app) |
| ?? **Backend API** | Node.js + Express REST API | [https://landchain-5eza.onrender.com/api/health](https://landchain-5eza.onrender.com/api/health) |
| ??? **Database** | PostgreSQL 18 (Lakebase) | Hosted on [Neon.tech](https://neon.tech) |
| ?? **Blockchain Layer** | Solidity ^0.8.20 Smart Contract | Ethers.js integration with fallback mode |

---

## ?? Key Features

1. **Immutable Ownership Ledger**: Property records and ownership histories are anchored cryptographically to Ethereum wallet addresses.
2. **Byte-Level Document Integrity (SHA-256)**: Uploaded deeds are fingerprinted into a 64-character SHA-256 hash. Modifying even one letter or byte in the document immediately triggers a **"Hash Mismatch / Tampered"** alert.
3. **Role-Based Access Control (RBAC)**:
   - **Admin (Registrar)**: Registers new land titles, binds cryptographic deed hashes, and reviews global audit trails.
   - **Owner (Citizen)**: Holds title to properties and initiates authorized ownership transfers to other wallet addresses.
   - **Viewer (Public / Buyer)**: Searches land registry records and verifies physical deed authenticity before purchasing.
4. **Audit Logging**: Every action (`PROPERTY_REGISTERED`, `OWNERSHIP_TRANSFERRED`, etc.) is logged with timestamps and user identities for complete transparency.

---

## ?? Architecture

```text
+-----------------------------------------------------------+
|                   React (Vite) Frontend                   |
|  - Dashboard, Property Search, Detail, Register, Transfer |
|  - Document Verification, History, Admin Panel            |
+-----------------------------+-----------------------------+
                              | REST JSON (Fetch API + JWT)
                              v
+-----------------------------------------------------------+
|                   Node.js / Express API                   |
|  - JWT Authentication & RBAC (Admin, Owner, Viewer)       |
|  - Raw-byte SHA-256 hashing & validation                  |
|  - Database reconciliation & audit logging                |
+--------------+-----------------------------+--------------+
               |                             |
               | pg (Pool queries)           | ethers.js (v6)
               v                             v
+-----------------------------+   +-----------------------------+
|    Neon Postgres Database   |   |   Solidity Smart Contract   |
|  - users, properties        |   |   (LandChain.sol ^0.8.20)   |
|  - ownership_transfers      |   |  - registerProperty (admin) |
|  - audit_logs               |   |  - transferOwnership (owner)|
+-----------------------------+   |  - verifyDocument           |
                                  |  - emit events              |
                                  +-----------------------------+
```

---

## ?? Demo Credentials

| Role | Email | Password | What to Demo |
|---|---|---|---|
| **Admin** | `admin@landchain.demo` | `admin123` | Register new land, view admin audit logs & stats |
| **Owner** | `owner@landchain.demo` | `owner123` | Transfer owned properties to a new wallet address |
| **Viewer** | `viewer@landchain.demo` | `viewer123` | Public property search and document integrity check |

---

## ?? Live Demo Walkthrough Script

1. **Sign In**: Navigate to [https://landchainss.netlify.app](https://landchainss.netlify.app) and sign in as `admin@landchain.demo`.
2. **Dashboard Overview**: Observe live stats (total properties, status breakdown, recent ledger activity).
3. **Property Directory**: Search properties by location (e.g., `Sector 7`, `Metro City`) and view registered owner wallet addresses.
4. **Register Land**:
   - Go to **Register Land**.
   - Input property code (e.g., `LAND-2024`), location, area in sq. meters, and an Ethereum wallet address (`0x...`).
   - Attach a deed document (PDF, DOCX, or PNG). Notice the live client-side SHA-256 hash preview.
   - Click **Register Property**.
5. **Document Integrity Verification**:
   - Go to **Document Verification**.
   - Select the registered property.
   - Upload the original file: **"Document Hash Matches the Registered Record"** (Green).
   - Edit a single byte or character in the file and re-upload: **"Document Hash Mismatch Detected"** (Red).
6. **Transfer Ownership**:
   - Select a property and enter a recipient wallet address (e.g. `0xabcdefabcdefabcdefabcdefabcdefabcdefabcd`).
   - Submit transfer and inspect updated ownership state and transaction event log.
7. **Audit & Transparency**:
   - Navigate to **Admin Control Panel** to inspect timestamped logs of every action performed.

---

## ?? Repository Structure

```text
+-- landchain/
¦   +-- backend/             # Node.js + Express REST API server
¦   ¦   +-- src/
¦   ¦   ¦   +-- app.js       # Express server entry point & CORS configuration
¦   ¦   ¦   +-- routes/      # Auth, properties, transactions, admin routes
¦   ¦   ¦   +-- services/    # Blockchain adapter & audit logging service
¦   ¦   ¦   +-- db/          # Neon/PostgreSQL pool client, migrations & seeds
¦   ¦   +-- tests/           # Jest API test suite (9 automated tests)
¦   +-- contracts/           # Hardhat project & Solidity smart contracts
¦   ¦   +-- src/             # LandChain.sol (^0.8.20)
¦   ¦   +-- test/            # 17 automated Hardhat unit tests
¦   +-- database/            # PostgreSQL migrations & synthetic seed records
¦   +-- frontend/            # React 19 + Vite SPA (Vanilla CSS design system)
+-- neon.ts                  # Neon Lakebase database branch configuration
+-- netlify.toml             # Netlify build and SPA routing redirects
+-- README.md                # Project documentation
```

---

## ??? Local Development Setup

### 1. Prerequisites
- **Node.js** v20+
- **PostgreSQL** or a free cloud database on [Neon.tech](https://neon.tech)

### 2. Backend Setup
```bash
cd landchain/backend
npm install
npm run migrate    # Runs database migrations
npm run seed       # Seeds initial demo accounts and properties
npm test           # Runs 9 Jest API automated tests
npm run dev        # Starts REST API on http://localhost:4000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run build      # Builds production bundle
npm run dev        # Starts Vite dev server on http://localhost:3000
```

---

## ?? Educational Disclaimer
*This project is an intermediate-level educational prototype developed to demonstrate blockchain-backed asset registries, decentralized authorization, and cryptographic document integrity verification.*
