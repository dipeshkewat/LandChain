# LandChain — Blockchain-Based Land Registry System

> **Intermediate-level educational prototype** for property registration, verifiable ownership transfers, immutable transaction event tracking, and byte-level document integrity verification via SHA-256 cryptographic hashing.

---

## 1. System Overview & Architecture

LandChain combines a Solidity smart contract enforcement layer with an Express/PostgreSQL metadata caching layer and a React single-page application dashboard.

```
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
|     PostgreSQL Database     |   |    Solidity Smart Contract  |
|  - users, properties        |   |    (LandChain.sol ^0.8.20)  |
|  - ownership_transfers      |   |  - registerProperty (admin) |
|  - audit_logs               |   |  - transferOwnership (owner)|
+-----------------------------+   |  - verifyDocument           |
                                  |  - emit events              |
                                  +-----------------------------+
```

### Critical Blockchain Environment Boundary (Remix VM vs Local JSON-RPC)
- **Remix VM:** Runs in-browser inside Remix IDE memory and is **not** a persistent JSON-RPC network addressable by external web applications.
- **Local Dev Chain Integration:** For full end-to-end RPC calls, the backend adapter uses a local JSON-RPC EVM node (such as Hardhat node: `http://127.0.0.1:8545`). When the RPC node is offline, the backend gracefully operates in fallback mode while keeping metadata and verification active.

---

## 2. Directory Structure

```
Blackchain/
├── contracts/               # Hardhat project & Solidity smart contract
│   ├── src/LandChain.sol   # Core contract (Solidty ^0.8.20)
│   ├── test/               # 17 Hardhat automated unit tests
│   └── hardhat.config.js
├── backend/                 # Node.js + Express REST API
│   ├── src/
│   │   ├── app.js          # Express app entry & configuration
│   │   ├── routes/         # auth, properties, transactions, admin
│   │   ├── services/       # ethers blockchain adapter, audit log
│   │   └── db/             # pg pool client, migration & seed runners
│   └── tests/              # Jest + Supertest API integration tests
├── database/                # PostgreSQL schema & synthetic demo seeds
│   ├── migrations/         # 001_initial_schema.sql (UUIDs, indexes)
│   └── seeds/              # 001_demo_data.sql (synthetic test data)
└── frontend/                # React 19 + Vite SPA (Modern Light Theme)
    ├── src/
    │   ├── components/     # Navbar, StatusBadge, AddressCopy, ErrorDisplay
    │   ├── pages/          # Dashboard, Search, Detail, Register, Transfer, History, Verify, Admin
    │   └── services/       # API client, Web Crypto SHA-256 helper
    └── vite.config.js
```

---

## 3. Environment Configuration

Copy the example environment configuration into both backend and frontend:

```bash
# In landchain/ or landchain/backend/
cp .env.example .env
```

### Required Variables:
| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `4000` | Port for Express API |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/landchain` | PostgreSQL connection string |
| `JWT_SECRET` | `landchain-dev-jwt-secret-replace-in-prod-xyz` | Secret key for JWT signing |
| `BLOCKCHAIN_RPC_URL`| `http://127.0.0.1:8545` | EVM JSON-RPC provider URL |
| `CONTRACT_ADDRESS` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | Deployed LandChain contract address |
| `ADMIN_PRIVATE_KEY`| `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` | Dev admin wallet private key |
| `VITE_API_URL` | `http://localhost:4000/api` | Frontend API endpoint URL |

---

## 4. Setup & Running Instructions

### Step 1: Smart Contracts & Tests
```bash
cd contracts
npm install
npm test
```
*Result: 17 passing tests validating admin controls, duplicate ID rejection, zero-address checks, and transfer authorization.*

To run a persistent local EVM JSON-RPC node:
```bash
npx hardhat node
```

### Step 2: Database Setup
Make sure PostgreSQL is running and a database named `landchain` is created:
```bash
createdb landchain
cd ../backend
npm install
npm run migrate
npm run seed
```

### Step 3: Backend REST API
```bash
cd ../backend
npm test       # Runs Jest automated API test suite (9 passing tests)
npm run dev    # Starts API server on http://localhost:4000
```

### Step 4: Frontend Web Application
```bash
cd ../frontend
npm install
npm run build  # Validates production Vite bundle
npm run dev    # Starts Vite dev server on http://localhost:3000
```

---

## 5. Automated Test Results

### Smart Contract Tests (`contracts/`)
- **Constructor:** Deployer set as admin.
- **Registration:** Successful registration, event emission, revert on non-admin, revert on duplicate ID, revert on zero document hash, revert on zero address.
- **Transfers:** Successful owner-initiated transfer, event emission, revert on non-owner, revert on non-existent property, revert on zero address, revert on transfer to current owner.
- **Document Verification & Lookup:** Validates matching hash, rejects mismatched hash, handles unknown properties.
- **Status:** **17 passing**

### Backend API Tests (`backend/`)
- **Health Check:** `/api/health` status reporting.
- **Document Hashing:** Exact byte hashing consistency, 1-byte alteration detection.
- **Authentication & RBAC:** Unauthenticated admin route rejection (401), invalid email format rejection (400), short password rejection (400).
- **Input Validation:** Non-UUID rejection (400), invalid hex tx hash rejection (400), unauthenticated transfer rejection (401).
- **Status:** **9 passing**

### Frontend Production Build (`frontend/`)
- Vite React build: **Built in <1s with 0 errors**.

---

## 6. Demonstration Credentials & Roles

| Role | Email | Password | Wallet Address |
|---|---|---|---|
| **Admin** | `admin@landchain.demo` | `admin123` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| **Owner** | `alice@landchain.demo` | `alice123` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| **Viewer**| `bob@landchain.demo` | `bob123` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |

---

## 7. Viva & Demo Walkthrough Script

1. **Sign In**: Log into `http://localhost:3000/login` with `admin@landchain.demo`.
2. **Dashboard Overview**: View confirmed vs pending properties and system statistics.
3. **Property Search & Filter**: Search properties by location or code; inspect recorded owner addresses.
4. **Register Property**: Fill in property details and upload a document. Observe the client-side SHA-256 digest computation and registration flow.
5. **Document Verification**: Navigate to `/verify`, select a property, and upload the original document to show **"Document Hash Matches"**; modify a single character in the file and re-upload to show **"Document Hash Mismatch"**.
6. **Owner Transfer**: Select a property and submit a transfer to another valid Ethereum address. Inspect the pending status and transaction history event.
7. **Audit & Admin Logs**: Navigate to `/admin` to inspect real-time audit logs for all actions performed.

---

## 8. Explicit Prototype Limitations & Disclaimers
- **Educational Prototype:** This system is an educational simulation. Recorded on-chain data does not represent legal title adjudication or government land registry certification.
- **Privacy:** Document hashes are recorded publicly on-chain, while full deed documents remain stored privately off-chain.
