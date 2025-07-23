# Money Manager - Smart Expense Tracking for Indian Users

A production-grade, mobile-first expense tracking web application with Google OAuth authentication, PostgreSQL backend, and intelligent spending insights. Specifically designed for Indian users with rupee formatting and local spending categories.

## Features

### 🔐 Authentication & Security
- **Google OAuth 2.0**: Secure authentication with Google accounts
- **Session Management**: Token-based user sessions
- **Protected Routes**: All expense data is user-specific and protected
- **Auto Backup**: Automatic Google Drive integration for data backup

### 🎯 Core Functionality
- **Smart Expense Entry**: Quick entry with amount, category, notes, and date
- **Custom Categories**: Add custom spending categories on-the-fly with AYS (Add Your Spending)
- **Monthly Dashboard**: Current and previous month summaries with spending totals
- **Data Visualization**: Interactive Chart.js charts (pie and bar) with elegant color schemes
- **Smart Insights**: AI-powered spending comparisons and month-over-month analysis
- **CSV Export**: Export monthly data for external analysis

### 📱 Mobile-First User Experience
- **Responsive Design**: Optimized for smartphones, tablets, and desktop
- **Orange Theme**: Elegant faded orange gradients with creamy white backgrounds
- **Intuitive Navigation**: Simplified month navigation (← Month Name →)
- **Floating Add Button**: Quick access with ripple effects
- **Optimized Expense Layout**: Clean grid layout for expense details
- **Collapsible Categories**: Space-efficient accordion-style organization

### 🔧 Technical Excellence
- **PostgreSQL Database**: Robust data storage with SQLAlchemy ORM
- **RESTful API**: Clean, secure API endpoints for all operations
- **Multi-user Support**: Complete user isolation and data protection
- **Performance Optimized**: Database indexing and query optimization
- **Error Handling**: Comprehensive error management and user feedback

## Technology Stack

### Backend
- **Flask**: Python web framework
- **PostgreSQL**: Primary database
- **SQLAlchemy**: Database ORM
- **Flask-CORS**: Cross-origin resource sharing

### Frontend
- **HTML5/CSS3**: Modern web standards
- **Vanilla JavaScript**: No framework dependencies
- **Bootstrap 5**: Responsive grid system
- **Chart.js**: Interactive data visualizations
- **Font Awesome**: Icon library

## Installation & Setup

### Prerequisites
- Python 3.8+
- PostgreSQL database
- Modern web browser

### Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Required variables:
```bash
DATABASE_URL=postgresql://username:password@localhost/money_manager
SESSION_SECRET=your-super-secret-session-key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
