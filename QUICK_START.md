# Quick Start Guide

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd /Users/ravimakwana/DholeraSIR
npm install express mongoose dotenv cors jsonwebtoken bcryptjs nodemon concurrently
```

### 2. Create Backend .env File

Create a file `backend/.env` with the following content:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/dholera-sir
JWT_SECRET=dholera_secret_key_2026
JWT_EXPIRE=30d
NODE_ENV=development
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# For macOS (if using Homebrew)
brew services start mongodb-community

# Or run manually
mongod
```

### 5. Start the Application

Option A - Start both servers together (recommended):
```bash
npm run dev:all
```

Option B - Start servers separately:

Terminal 1 (Backend):
```bash
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Creating First Admin User

1. Register a new user through the UI at http://localhost:3000/register
2. Verify with OTP (check console logs in development mode)
3. Connect to MongoDB and update the user role:

```bash
# Connect to MongoDB
mongosh

# Use the database
use dholera-sir

# Update user role to admin
db.users.updateOne(
  { mobileNumber: "your_mobile_number" },
  { $set: { role: "admin" } }
)
```

## Testing the Application

### Test User Login
1. Go to http://localhost:3000/login
2. Enter mobile number and password
3. Verify OTP (check backend console for OTP in development)
4. Access dashboard

### Test Adding a Deal (Admin)
1. Login as admin
2. Click "Add Deal"
3. Fill in:
   - Village Name: Dholera
   - Survey Number: 123
   - Price per Sq. Yard: 5000
   - Total Sq. Yard: 1000
   - Payment Deadline Month: 2026-03
4. Submit

### Test Adding Payment
1. Open the deal details
2. Click "Add Payment"
3. Fill in:
   - Date: 2026-02-13
   - Mode: NEFT
   - Amount: 500000
   - Remarks: IN HAND ALPESH BHAI
4. Submit

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
brew services list

# Start MongoDB
brew services start mongodb-community
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules frontend/node_modules
npm install
cd frontend && npm install
```

### CORS Error
Make sure backend has CORS enabled (already configured in server.js)

## Default Test Credentials

After creating your first admin user, you can use:
- Mobile: (your registered number)
- Password: (your password)

## Environment Variables

Required backend environment variables:
- `PORT` - Backend server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - Token expiration time
- `NODE_ENV` - Environment (development/production)

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Start MongoDB
4. ✅ Start application servers
5. ✅ Register first user
6. ✅ Promote user to admin
7. ✅ Start adding deals and payments

For detailed documentation, see [README.md](README.md)
