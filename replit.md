# Money Manager - Replit Coding Agent Guide

## Overview

This is a production-grade, mobile-first expense tracking web application built specifically for Indian users. The application provides secure Google OAuth authentication, smart money management features with rupee formatting, custom category creation, and AI-powered spending insights. It's designed as a secure multi-user application with a Flask backend and PostgreSQL database.

## Recent Changes (July 2025)

✓ Implemented Google OAuth 2.0 authentication with session management
✓ Added multi-user support with user-specific data isolation
✓ Enhanced mobile-first design with improved header layout and row-based dashboard cards
✓ Integrated custom category creation with AYS (Add Your Spending) feature
✓ Optimized expense item layout with grid-based positioning (note/amount top, date/delete bottom)
✓ Improved color scheme for chart visualizations with elegant contrasting colors
✓ Added user authentication middleware and protected all API routes

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python) with RESTful API design
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Data Models**: Single `Expense` model with indexed fields for performance
- **Configuration**: Environment-based configuration with fallback defaults
- **CORS**: Enabled for cross-origin requests

### Frontend Architecture
- **Design Pattern**: Mobile-first responsive design
- **Technology**: Vanilla JavaScript with Bootstrap 5 for responsive grid
- **UI Framework**: No JavaScript framework dependencies - pure DOM manipulation
- **Visualization**: Chart.js for interactive data charts
- **Styling**: Custom CSS with CSS variables for theming

### Key Design Decisions
- **Mobile-First**: Optimized primarily for smartphone usage with responsive breakpoints
- **Indian Localization**: Rupee currency formatting and culturally relevant expense categories
- **Single-Page Application**: No page refreshes, all interactions via AJAX
- **Progressive Enhancement**: Works without JavaScript for basic functionality

## Key Components

### Database Layer
- **Expense Model**: Core entity with amount (Decimal), category, note, date, and timestamps
- **Indexing Strategy**: Database indexes on date, category, and created_at for query performance
- **Data Types**: Numeric(10,2) for precise currency handling

### API Layer
- **RESTful Endpoints**: Standard HTTP methods for CRUD operations
- **Route Structure**: `/api/` prefix for all API endpoints
- **Error Handling**: Comprehensive error responses with appropriate HTTP status codes
- **Data Validation**: Server-side validation for all inputs

### Frontend Components
- **Dashboard**: Monthly summary cards with navigation
- **Expense Form**: Modal-based form with real-time validation
- **Category Management**: Accordion-style collapsible expense groupings
- **Visualization**: Toggle between pie and bar charts for category breakdown
- **Export Functionality**: CSV export for monthly data

### UI/UX Features
- **Theme**: Faded orange (#FFA361) header with creamy white (#FDF7F0) background
- **Floating Action Button**: Material Design-inspired add button with ripple effect
- **Smart Insights**: AI-powered spending comparisons and alerts
- **Input Validation**: Real-time validation with visual feedback

## Data Flow

### Expense Creation Flow
1. User clicks floating add button
2. Modal form opens with pre-filled current date
3. Client-side validation on form submission
4. POST request to `/api/expenses` endpoint
5. Server validates and stores in PostgreSQL
6. Response triggers UI update and chart refresh

### Data Retrieval Flow
1. Month navigation triggers API call with month/year parameters
2. Server queries expenses with date filtering using SQLAlchemy
3. Data aggregation for dashboard summaries
4. Chart data preparation and rendering
5. Expense list rendering with category grouping

### Dashboard Updates
- Real-time calculation of monthly totals
- Category breakdown for visualizations
- Previous month comparison for insights
- Automatic month detection and navigation

## External Dependencies

### Frontend Libraries
- **Bootstrap 5**: CSS framework for responsive design
- **Font Awesome**: Icon library for consistent iconography
- **Chart.js**: Interactive chart library for data visualization

### Backend Dependencies
- **Flask**: Web framework and routing
- **SQLAlchemy**: Database ORM and query builder
- **Flask-CORS**: Cross-origin resource sharing
- **PostgreSQL**: Primary database engine

### Development Tools
- **Python 3.8+**: Runtime requirement
- **Modern Browser**: HTML5/CSS3 support required

## Deployment Strategy

### Environment Configuration
- **Database URL**: Configurable via `DATABASE_URL` environment variable
- **Session Secret**: Configurable via `SESSION_SECRET` environment variable
- **Default Fallbacks**: Development-friendly defaults for local testing

### Database Setup
- **Auto-Migration**: Tables created automatically on app startup
- **Connection Pooling**: Configured for production with pool recycling
- **Health Checks**: Pool pre-ping enabled for connection reliability

### Production Considerations
- **Debug Mode**: Controlled via Flask configuration
- **CORS**: Enabled for API endpoints
- **Static Files**: Served via Flask for development, should use CDN in production
- **Database Performance**: Indexes configured for common query patterns

### Scalability Features
- **Database Indexing**: Optimized for date-range and category queries
- **API Design**: RESTful architecture for horizontal scaling
- **Frontend Optimization**: Minimal JavaScript dependencies for fast loading
- **Caching Strategy**: Browser caching for static assets via appropriate headers