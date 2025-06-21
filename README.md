# MedSpaSync Pro - The AI Intelligence Layer for Medical Spas

**Stop losing 8+ hours weekly to manual reconciliation with 95%+ AI accuracy.**

Built by 10-year medical spa industry veteran Jacob Hagood, MedSpaSync Pro eliminates the reconciliation nightmare that costs medical spas $2,500+ monthly in missed revenue from unmatched transactions.

## 🎯 **Proven Results**

- **8+ hours weekly** saved from manual reconciliation
- **$2,500+ monthly** in recovered revenue from unmatched transactions  
- **95%+ AI accuracy** in transaction matching
- **97% match rate** real user results
- **6 hours weekly to 15 minutes** transformation example
- **24 hours** implementation timeline
- **$299/month** honest pricing

## 🚀 **Quick Start**

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build MedSpaSync Pro design system:
   ```bash
   npm run build:css
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 🏥 **Medical Spa Industry Expertise**

MedSpaSync Pro is built by someone who lived the reconciliation nightmare. Our AI Intelligence Layer understands the unique challenges of matching POS transactions with loyalty programs like Alle (Allergan) and Aspire (Galderma).

### Real Transformation Example
> "We reduced reconciliation from 6 hours weekly to just 15 minutes with 97% match rate accuracy. Our operations manager can now focus on patient experience instead of spreadsheets."  
> — Multi-location Med Spa, Atlanta

## 🛡️ **Trust & Security**

- **HIPAA-Conscious Security** - Your data is encrypted and protected
- **QuickBooks Integration** - Seamless financial reporting
- **24-Hour Implementation** - Most spas are reconciling within a day
- **30-Day Money-Back Guarantee** - Risk-free trial

## 📞 **Support**

Built by Jacob Hagood, 10-year medical spa industry veteran  
Email: support@medspasync.com  
Implementation Support: 24-hour response time

---

*MedSpaSync Pro: The AI Intelligence Layer for Medical Spas*

# MedSpaSync Pro Landing Page

A professional landing page for MedSpaSync Pro, featuring AI-powered reconciliation demo and lead capture functionality.

## 🚀 Features

- **Interactive Demo**: Upload CSV files to see MedSpaSync Pro's AI reconciliation in action
- **Proven Metrics**: Demonstrates 8+ hours weekly savings and $2,500+ monthly revenue protection
- **Lead Capture**: Collect and manage leads with backend integration
- **Responsive Design**: Optimized for all devices
- **Brand Alignment**: Consistent with MedSpaSync Pro's medical spa industry expertise

## 🛠️ Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API server (optional, see Backend Integration below)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MythosMediaCo/medspasync-landing.git
cd medspasync-landing
```

2. Install dependencies:
```bash
npm install
```

3. Build the CSS:
```bash
npm run build-css
```

4. Start the development server:
```bash
npm run dev
```

The landing page will be available at `http://localhost:3000`

## 🔗 Backend Integration

This landing page can connect to the MedSpaSync Pro backend API for enhanced functionality:

### Configuration

Set the backend API URL in your environment:

```bash
# For local development
BACKEND_API_URL=http://localhost:5000

# For production
BACKEND_API_URL=https://your-backend-domain.com
```

### Features with Backend

- **Real AI Processing**: File uploads and reconciliation processing handled by the backend
- **Lead Management**: Lead data sent to backend for email notifications and storage
- **Analytics**: User interactions tracked and sent to backend analytics
- **Fallback Mode**: If backend is unavailable, demo runs with simulated data

### Backend Endpoints Used

- `POST /api/reconciliation/upload` - Upload CSV files
- `POST /api/reconciliation/process` - Start reconciliation processing
- `GET /api/reconciliation/jobs/:jobId` - Get processing results
- `POST /api/contact` - Submit lead/contact information

## 📁 Project Structure

```
medspasync-landing/
├── public/                 # Static files served to browser
│   ├── index.html         # Main landing page
│   ├── demo.js            # Demo functionality
│   └── tailwind.css       # Compiled CSS
├── server/                # Express server
│   ├── index.js           # Main server file
│   └── routes/            # API routes
├── tailwind-input.css     # Tailwind source CSS
├── tailwind.config.js     # Tailwind configuration
└── config.js              # Application configuration
```

## 🎨 Customization

### Brand Colors

The landing page uses MedSpaSync Pro's brand colors defined in `tailwind.config.js`:

- Primary: `#000000` (Black)
- Secondary: `#FFFFFF` (White)
- Accent: `#FF6B35` (Orange)
- Success: `#10B981` (Green)

### Proven Metrics

Update the proven metrics in `config.js` to match your latest results:

```javascript
provenMetrics: {
  hoursWeeklySaved: 8,
  monthlyRevenueProtected: 2500,
  aiAccuracyRate: 95,
  realUserAccuracy: 97,
  transformationTime: '6 hours weekly to 15 minutes',
  implementationTime: '24 hours'
}
```

## 🚀 Deployment

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build-css`
3. Set publish directory: `public`
4. Add environment variables for backend URL

### Vercel

1. Import your GitHub repository to Vercel
2. Set build command: `npm run build-css`
3. Set output directory: `public`
4. Configure environment variables

## 📊 Analytics

The landing page tracks user interactions and sends data to:
- Google Analytics (if configured)
- Backend analytics endpoint (if available)
- Local storage for demo usage tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support or questions about MedSpaSync Pro, contact:
- Email: support@medspasync.com
- Built by Jacob Hagood, 10-year medical spa industry veteran


