# Dholera SIR - Land Deal Management System

A comprehensive MERN stack web application for managing land deals, tracking payments, and maintaining deal records. Built with MongoDB, Express.js, React, and Node.js.

## Features

### Authentication
- Mobile number + Password authentication
- OTP verification system
- Role-based access control (Admin/User)

### Deal Management
- Add new land deals with village name and survey number
- Search deals by village name or survey number
- Track price per sq. yard and total area
- Calculate total deal amount automatically
- Set payment deadline months

### Payment Tracking
- Add multiple payment records per deal
- Support for various payment modes (NEFT, RTGS, CASH, CHEQUE, UPI, etc.)
- Track payment date, amount, and remarks
- Real-time calculation of total paid and remaining amounts
- Complete payment history with detailed logs

### Responsive Design
- Mobile-friendly interface
- Works seamlessly on laptops, tablets, and smartphones
- Modern, clean UI with intuitive navigation

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS3** - Styling (responsive design)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the project root directory:
```bash
cd /Users/ravimakwana/DholeraSIR
```

2. Install backend dependencies:
```bash
npm install express mongoose dotenv cors jsonwebtoken bcryptjs nodemon concurrently
```

3. Create `.env` file in the backend directory:
```bash
cp backend/.env.example backend/.env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/dholera-sir
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=30d
NODE_ENV=development
```

5. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

### Running Both Servers Simultaneously

From the root directory:
```bash
npm run dev:all
```

## Database Schema

### User Schema
```javascript
{
  mobileNumber: String (unique),
  password: String (hashed),
  name: String,
  role: String (admin/user),
  otp: String,
  otpExpiry: Date,
  isVerified: Boolean
}
```

### Deal Schema
```javascript
{
  villageName: String,
  surveyNumber: String,
  pricePerSqYard: Number,
  totalSqYard: Number,
  totalAmount: Number (calculated),
  paymentDeadlineMonth: Date,
  customerName: String,
  customerContact: String,
  createdBy: ObjectId (ref: User)
}
```

### Payment Schema
```javascript
{
  dealId: ObjectId (ref: Deal),
  date: Date,
  modeOfPayment: String,
  amount: Number,
  remarks: String,
  createdBy: ObjectId (ref: User)
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-otp` - Send OTP to mobile
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/profile` - Get user profile (Protected)

### Deals
- `GET /api/deals` - Get all deals (Protected)
- `GET /api/deals/:id` - Get deal by ID with payment summary (Protected)
- `GET /api/deals/search?q=term` - Search deals (Protected)
- `POST /api/deals` - Create new deal (Admin only)
- `PUT /api/deals/:id` - Update deal (Admin only)
- `DELETE /api/deals/:id` - Delete deal (Admin only)

### Payments
- `GET /api/payments` - Get all payments (Protected)
- `GET /api/payments/deal/:dealId` - Get payments for a deal (Protected)
- `POST /api/payments` - Add payment (Protected)
- `PUT /api/payments/:id` - Update payment (Admin only)
- `DELETE /api/payments/:id` - Delete payment (Admin only)

## Usage

### Creating an Admin User
To create an admin user, you need to manually set the role in the database:

```javascript
// Using MongoDB shell or Compass
db.users.updateOne(
  { mobileNumber: "your_mobile_number" },
  { $set: { role: "admin" } }
)
```

### Adding a Deal (Admin Only)
1. Login as admin
2. Click "Add Deal" in the navigation
3. Fill in the deal details:
   - Village Name
   - Survey Number
   - Price per Sq. Yard
   - Total Sq. Yard
   - Payment Deadline Month
   - Customer details (optional)
4. Submit to create the deal

### Adding Payments
1. Navigate to a deal's detail page
2. Click "Add Payment" button (Admin only)
3. Fill in payment details:
   - Date
   - Mode of Payment
   - Amount
   - Remarks
4. Submit to record the payment

### Searching Deals
- Use the search bar on the dashboard
- Search by village name or survey number
- Results update in real-time

## OTP Integration

The application includes OTP functionality. For production, integrate with:

### Option 1: MSG91 (Recommended for India)
```javascript
// Update backend/utils/smsService.js
const axios = require('axios');

const sendOTP = async (mobileNumber, otp) => {
  const response = await axios.get('https://api.msg91.com/api/v5/otp', {
    params: {
      authkey: process.env.MSG91_API_KEY,
      mobile: mobileNumber,
      otp: otp
    }
  });
  return response.data.type === 'success';
};
```

### Option 2: Twilio
```javascript
// Update backend/utils/smsService.js
const twilio = require('twilio');

const sendOTP = async (mobileNumber, otp) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  await client.messages.create({
    body: `Your OTP is: ${otp}. Valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+91${mobileNumber}`
  });
  return true;
};
```

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- OTP verification for new users
- Protected routes with role-based access
- Input validation and sanitization

## Responsive Design

The application is fully responsive and works on:
- Desktop (1920px and above)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## Future Enhancements

- Export deals and payments to Excel/PDF
- Email notifications for payment reminders
- Dashboard analytics and charts
- Bulk upload of deals
- Document attachment support
- Payment receipt generation
- Advanced filtering and sorting

## License

This project is private and proprietary.

## Support

For support, contact the development team.
