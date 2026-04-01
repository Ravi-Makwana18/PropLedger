# 🏗️ PropLedger - Land Deal Management System

A comprehensive full-stack MERN application for managing land deals, tracking payments, and maintaining customer records. Built with modern web technologies and best practices.

![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)

## ✨ Features

### 🔐 Authentication & Authorization
- Secure mobile number + password authentication
- JWT-based session management
- OTP verification system (ready for SMS integration)
- Role-based access control (Admin/User)
- Token-based API protection

### 📊 Deal Management
- Create and manage land deals with comprehensive details
- Track village name, survey number, and property specifications
- Automatic calculation of total amounts and derived values
- Support for Buy/Sell/Other deal types
- Advanced search functionality by village or survey number
- Payment deadline tracking

### 💰 Payment Tracking
- Record multiple payments per deal
- Support for various payment modes (NEFT, RTGS, CASH, CHEQUE, UPI, ANGADIA)
- Real-time calculation of paid and remaining amounts
- Complete payment history with audit trail
- Detailed payment logs with timestamps

### 📱 Customer Enquiry Management
- Public enquiry submission form
- Admin dashboard for managing enquiries
- Read/unread status tracking
- Enquiry type categorization

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

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/propledger.git
cd propledger
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d

# Admin Seeder (Optional)
ADMIN_NAME=Admin
ADMIN_MOBILE=9999999999
ADMIN_PASSWORD=admin@123
```

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5001
```

### 4. MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and update `MONGO_URI` in `.env`

### 5. Create Admin User

```bash
npm run seed:admin
```

This will create an admin user with credentials from your `.env` file.

### 6. Start the Application

```bash
# Start both backend and frontend
npm run dev:all

# Or start separately:
# Backend only
npm run dev

# Frontend only (in another terminal)
npm run client
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

## 📁 Project Structure

```
propledger/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── dealController.js     # Deal management
│   │   ├── paymentController.js  # Payment tracking
│   │   └── enquiryController.js  # Enquiry handling
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── errorHandler.js       # Global error handler
│   │   └── asyncHandler.js       # Async wrapper
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Deal.js               # Deal schema
│   │   ├── Payment.js            # Payment schema
│   │   └── Enquiry.js            # Enquiry schema
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── dealRoutes.js         # Deal endpoints
│   │   ├── paymentRoutes.js      # Payment endpoints
│   │   └── enquiryRoutes.js      # Enquiry endpoints
│   ├── utils/
│   │   ├── generateToken.js      # JWT generator
│   │   └── smsService.js         # OTP SMS service
│   ├── seedAdmin.js              # Admin user seeder
│   └── server.js                 # Express app entry
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js          # Axios configuration
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Main layout
│   │   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   │   ├── Topbar.jsx        # Top navigation
│   │   │   └── PrivateRoute.js   # Protected routes
│   │   ├── context/
│   │   │   └── AuthContext.js    # Auth state management
│   │   ├── pages/
│   │   │   ├── Login.js          # Login page
│   │   │   ├── Register.js       # Registration page
│   │   │   ├── Dashboard.js      # Main dashboard
│   │   │   ├── AddDeal.js        # Create deal form
│   │   │   ├── DealDetails.js    # Deal details view
│   │   │   └── HistoryPage.js    # Payment history
│   │   ├── App.js                # Root component
│   │   └── index.js              # React entry point
│   └── package.json
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Root dependencies
└── README.md                     # This file
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
- ✅ CORS configuration for cross-origin requests
- ✅ Input validation and sanitization
- ✅ Protected routes with role-based access
- ✅ Environment variable protection
- ✅ MongoDB injection prevention with Mongoose
- ✅ Error handling without exposing sensitive data

## 📱 SMS Integration (Optional)

The application supports OTP verification via SMS. To enable:

### Option 1: MSG91 (Popular in India)

1. Sign up at [MSG91](https://msg91.com/)
2. Get your API key and template ID
3. Update `.env`:
```env
MSG91_API_KEY=your_api_key
MSG91_SENDER_ID=your_sender_id
```
4. Uncomment MSG91 code in `backend/utils/smsService.js`

### Option 2: Twilio (International)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID, Auth Token, and Phone Number
3. Update `.env`:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```
4. Uncomment Twilio code in `backend/utils/smsService.js`

## 🚢 Deployment

### Backend (Render/Railway/Heroku)

1. Create a new web service
2. Connect your GitHub repository
3. Set environment variables from `.env`
4. Deploy!

### Frontend (Vercel/Netlify)

1. Create a new project
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set output directory: `build`
5. Add environment variable: `REACT_APP_API_URL=your_backend_url`
6. Deploy!

## 🧪 Testing

```bash
# Test backend connection
curl http://localhost:5001/api/health

# Test MongoDB connection
npm run dev
# Check console for "✅ MongoDB Connected"
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Authors

**PropLedger Development Team**

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Vercel/Render for deployment platforms
- React community for excellent documentation
- Express.js team for the robust framework

## 📞 Support

For support, email ravimakwana8205@gmail.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Export deals and payments to Excel/PDF
- [ ] Email notifications for payment reminders
- [ ] Dashboard analytics with charts
- [ ] Bulk upload of deals via CSV
- [ ] Document attachment support
- [ ] Payment receipt generation
- [ ] Advanced filtering and sorting
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark mode theme

---

**Built with ❤️ by Ravi Makwana*
