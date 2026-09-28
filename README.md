# Bank Transaction & Ledger System

A production-style banking backend that simulates real-world financial transaction workflows. Built with **Node.js, Express.js, and MongoDB**, it derives account balances from ledger entries and prevents duplicate transactions through idempotency validation.

**Live API:** [LIVE](https://bank-transaction-ledger-system-1.onrender.com/) *(hosted on a free tier, so the first request may take ~30 seconds to wake up)*

## Features

- **Authentication:** registration, login, and logout with JWT, bcrypt password hashing, and protected routes via middleware
- **Account management:** account creation with status validation before any financial operation
- **Transactions:** credit and debit operations with sender/receiver validation, tracked transaction states, and transaction history
- **Idempotency:** retried or duplicate requests never create duplicate transactions
- **Ledger system:** balances are calculated from ledger entries using MongoDB aggregation pipelines, not from a stored balance field
- **Security:** token blacklisting and additional checks on financial operations
- **Email notifications:** registration and transaction emails via Nodemailer
- **API testing:** all endpoints tested with Postman

## Tech Stack

| Category | Technologies |
|---|---|
| Backend | Node.js, Express.js |
| Database | MongoDB, MongoDB Atlas, Aggregation Pipelines |
| Auth & Security | JWT, bcrypt, cookie-parser, dotenv |
| Communication & Testing | Nodemailer, Postman |

## Architecture

```text
Client / Postman
       │
       ▼
Express Server ── Routes ── Auth Middleware ── Controllers ── Models
       │
       ▼
MongoDB Atlas: Users | Accounts | Transactions | Ledgers | Blacklist
```

### Transaction Flow

```text
Authenticate user → Validate account → Validate sender/receiver
→ Idempotency check → Create transaction → Update transaction state
→ Create ledger entry → Derive balance from ledger → Send email notification
```

## Project Structure

```text
Bank-Transaction-Ledger-System/
├── src/
│   ├── controllers/   # request handling
│   ├── middleware/    # authentication and validation
│   ├── models/        # MongoDB schemas
│   └── routes/        # API endpoints
├── server.js
├── package.json
└── .env               # not committed
```

## Getting Started

**Prerequisites:** Node.js 18+ and a MongoDB connection string (local or Atlas).

```bash
git clone https://github.com/snehchoudhary/Bank-Transaction-Ledger-System.git
cd Bank-Transaction-Ledger-System
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
```

Start the server:

```bash
npm run dev
```

The API runs at `http://localhost:3000`.

## API Overview

Protected routes need this header: `Authorization: Bearer <your_token>`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Log in and receive a JWT | No |
| POST | `/api/transaction` | Create a credit/debit transaction | Yes |
| ... | ... | *Add the rest of your endpoints here* | ... |

## Future Improvements

- Automated unit and integration tests
- Database transactions using MongoDB sessions for atomic debit/credit
- API rate limiting
- Structured logging and monitoring
- Docker support
- Swagger/OpenAPI documentation

## Author

**Sneha Choudhary** · [GitHub](https://github.com/snehchoudhary) · [LinkedIn](https://www.linkedin.com/in/sneha-choudhary-58a5552a8/)
