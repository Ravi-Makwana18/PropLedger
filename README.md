# 🏗️ PropLedger - Land Deal Management System

A comprehensive full-stack MERN application for managing land deals, tracking payments, and maintaining customer records. Built with modern web technologies and best practices.

![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)

## ✨ Features

### 🔐 Authentication & Authorization
- Secure email + password authentication
- JWT-based session management
- Role-based access control (Admin/User)
- Token-based API protection

### 📊 Deal Management
- Create and manage land deals with comprehensive details
- Track village name, survey number, and property specifications
- Automatic calculation of total amounts and derived values
- Support for Buy/Sell/Other deal types
- Search functionality by village or survey number
- Payment deadline tracking

### 💰 Payment Tracking
- Record multiple payments per deal
- Real-time calculation of paid and remaining amounts
- Complete payment history with audit trail
- Detailed payment logs with timestamps


### 🎨 Modern UI/UX
- Fully responsive design (mobile, tablet, desktop)
- Clean and intuitive interface
- Real-time data updates
- Professional styling with modern CSS

## 🛠️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - Secure authentication tokens
- **bcryptjs** - Password hashing and encryption

### Frontend
- **React** - Component-based UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Context API** - Global state management
- **CSS3** - Modern responsive styling

### DevOps & Tools
- **Nodemon** - Development auto-reload
- **Concurrently** - Run multiple npm scripts
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB Atlas** account (or local MongoDB)
- **Git** for version control

## 🚀 Quick Start

1. **Clone & Install Dependencies**
   ```bash
   git clone https://github.com/yourusername/propledger.git
   cd propledger
   npm run install:all    # One-click install for both backend and frontend
   ```

2. **Environment Setup**
   Create a `.env` file in the root based on your `.env.example`. Make sure to set your `MONGO_URI`.

3. **Run the Project**
   ```bash
   npm run dev            # Concurrently boots up the server and client
   ```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register        # Register new user
POST   /api/auth/login           # Login user
POST   /api/auth/logout          # Logout user
POST   /api/auth/send-otp        # Send OTP to mobile
POST   /api/auth/verify-otp      # Verify OTP
GET    /api/auth/profile         # Get user profile (Protected)
GET    /api/auth/verify          # Verify JWT token (Protected)
```

### Deals
```
GET    /api/deals                # Get all deals (Protected)
POST   /api/deals                # Create new deal (Admin)
GET    /api/deals/search?q=term  # Search deals (Protected)
GET    /api/deals/:id            # Get deal by ID (Protected)
PUT    /api/deals/:id            # Update deal (Admin)
DELETE /api/deals/:id            # Delete deal (Admin)
```

### Payments
```
GET    /api/payments             # Get all payments (Protected)
POST   /api/payments             # Add payment (Protected)
GET    /api/payments/history     # Get payment history (Protected)
GET    /api/payments/deal/:id    # Get payments for deal (Protected)
PUT    /api/payments/:id         # Update payment (Admin)
DELETE /api/payments/:id         # Delete payment (Admin)
```

### Enquiries
```
POST   /api/enquiry              # Submit enquiry (Public)
GET    /api/enquiry/all          # Get all enquiries
GET    /api/enquiry/unread-count # Get unread count
PATCH  /api/enquiry/:id/read     # Mark as read
DELETE /api/enquiry/:id          # Delete enquiry
DELETE /api/enquiry/all          # Delete all enquiries
```

## 🔒 Security Features

- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ JWT-based authentication with 1-hour expiry
- ✅ HTTP-only cookies for token storage
- ✅ Cookie-first auth flow by default (token fallback only when explicitly enabled)
- ✅ CORS configuration for cross-origin requests
- ✅ Rate limiting on auth and write-heavy API routes
- ✅ Input validation and sanitization
- ✅ Protected routes with role-based access
- ✅ Environment variable protection
- ✅ MongoDB injection prevention with Mongoose
- ✅ Error handling without exposing sensitive data


## 🚢 Deployment

PropLedger is configured for Render-only deployment as a single web service.

Since `backend/server.js` serves the React build in production, deploy the whole monorepo from the repo root:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `MONGO_URI=...`
  - `JWT_SECRET=...`
  - `JWT_EXPIRE=30d`
  - `FRONTEND_URL=https://your-app.onrender.com`

For production on Render-only deployment, leave `REACT_APP_API_URL` unset so the frontend uses same-origin `/api` requests.

## 🧪 Testing

```bash
# Test backend connection
curl http://localhost:5001/api/health

# Readiness check
curl http://localhost:5001/api/ready

# Run backend smoke tests
npm run test:backend

# Run Mongo-backed integration tests
npm run test:backend:integration

# Run the full backend suite
npm run test:backend:all

# Test MongoDB connection
npm run dev
# Check console for "✅ MongoDB Connected"
```

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Render for application hosting
- React community for excellent documentation
- Express.js team for the robust framework

**Built with ❤️ by Ravi Makwana**
