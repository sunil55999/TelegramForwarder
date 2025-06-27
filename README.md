
# AutoForwardX - Telegram Message Forwarding Platform

## 📋 Table of Contents
- [About the Project](#about-the-project)
- [Built With](#built-with)
- [Core Features](#core-features)
- [Demo & Screenshots](#demo--screenshots)
- [Environment Setup](#environment-setup)
- [Getting Started](#getting-started)
- [Hosting & Deployment](#hosting--deployment)
- [Installation Guide](#installation-guide)
- [JWT Authentication](#jwt-authentication)
- [Key Components](#key-components)
- [Login System](#login-system)
- [Mobile Optimization](#mobile-optimization)
- [Navigation Structure](#navigation-structure)
- [Order Processing](#order-processing)
- [Payment Integration](#payment-integration)
- [Queue Management](#queue-management)
- [Rate Limiting](#rate-limiting)
- [Session Management](#session-management)
- [Telegram API Integration](#telegram-api-integration)
- [User Management](#user-management)
- [Verification System](#verification-system)
- [Workflow Management](#workflow-management)
- [X-Factor Features](#x-factor-features)
- [Yak Shaving (Performance)](#yak-shaving-performance)
- [Zero-Downtime Features](#zero-downtime-features)

## About the Project

AutoForwardX is a modern, dark-themed web platform designed for automated Telegram message forwarding. The platform provides seamless multi-account Telegram forwarding with advanced features like chain forwarding, content filtering, and real-time analytics.

### 🎯 Mission
To provide the most reliable and feature-rich Telegram auto-forwarding platform, trusted by thousands of users worldwide.

### 🏆 Key Achievements
- **99.9% Uptime**: Robust session management and auto-recovery
- **Multi-Account Support**: Handle multiple Telegram accounts from one dashboard
- **Advanced Filtering**: Smart content management with blocking and watermarking
- **Real-Time Analytics**: Comprehensive reporting and monitoring tools

## Built With

### Frontend Stack
- **React 18** with TypeScript for type-safe component development
- **Wouter** for lightweight client-side routing
- **TanStack Query** (React Query) for efficient server state management
- **Shadcn/ui** components with Radix UI primitives
- **Tailwind CSS** with custom dark theme variables
- **Vite** for fast development and optimized builds

### Backend Stack
- **Node.js** with Express.js framework
- **TypeScript** with ES modules for type safety
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** via Neon serverless database
- **JWT** for secure authentication
- **bcrypt** for password hashing

### Infrastructure
- **Replit** for hosting and deployment
- **NowPayments** for cryptocurrency payments
- **PayPal** for traditional payments
- **Telegram Bot API** for bot interactions

## Core Features

### 🚀 Advanced Forwarding
- **Chain Forwarding**: Link multiple channels in sequence
- **Copy Mode**: Duplicate messages without forwarding headers
- **Save-only Channel Support**: Archive messages without public forwarding
- **Real-Time Sync**: Instant message forwarding with minimal delay
- **Session Auto-Recovery**: Automatic reconnection on network issues

### 🎨 Smart Content Management
- **Sentence Blocking**: Filter messages containing specific phrases
- **Image Blocking**: Block image forwarding selectively
- **Watermarking**: Add custom watermarks to forwarded content
- **Content Filtering**: Advanced filtering rules and conditions

### 📊 Analytics & Monitoring
- **Real-Time Logs**: Live activity monitoring
- **48-Hour Active Pair Reports**: Detailed forwarding statistics
- **Performance Metrics**: Queue status and processing statistics
- **Error Tracking**: Comprehensive error logging and alerts

### 🤖 Bot Integration
- **Task Management Bot**: Control operations via Telegram commands
- **Notification Bot**: Instant alerts and status updates
- **Remote Operations**: Start/stop forwarding pairs remotely
- **Custom Commands**: Personalized bot interactions

### 👥 Multi-Account Management
- **Unified Dashboard**: Manage multiple Telegram accounts
- **Session Health Monitoring**: Track account connection status
- **Account Switching**: Seamless switching between accounts
- **Bulk Operations**: Manage multiple forwarding pairs simultaneously

## Demo & Screenshots

### 🎥 Live Demo
Visit the live application at: [Your Replit URL]

### 📱 Mobile Interface
The platform is fully responsive and optimized for mobile devices with:
- Touch-friendly interface
- Adaptive layouts
- Mobile-specific navigation
- Optimized performance

## Environment Setup

### 📋 Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Telegram Bot Token
- PayPal Developer Account
- NowPayments API Key

### 🔐 Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=your_postgresql_connection_string
DIRECT_URL=your_direct_database_url

# Authentication
JWT_SECRET=your_jwt_secret_key
BCRYPT_ROUNDS=12

# Telegram API
TELEGRAM_API_ID=your_telegram_api_id
TELEGRAM_API_HASH=your_telegram_api_hash
BOT_TOKEN=your_telegram_bot_token

# Payment Gateways
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
NOWPAYMENTS_API_KEY=your_nowpayments_api_key

# Server Configuration
PORT=5000
NODE_ENV=production
```

## Getting Started

### 🚀 Quick Start
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npm run db:migrate`
5. Start development server: `npm run dev`

### 📁 Project Structure
```
AutoForwardX/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Node.js backend
│   ├── routes.ts          # API endpoints
│   ├── db.ts             # Database configuration
│   ├── telegram-api.ts   # Telegram integration
│   └── queue-manager.ts  # Message queue handling
├── shared/               # Shared TypeScript schemas
└── migrations/          # Database migrations
```

## Hosting & Deployment

### 🌐 Replit Deployment
This project is optimized for Replit hosting:

1. **Automatic Dependency Installation**: Package.json automatically installs dependencies
2. **Environment Variables**: Use Replit Secrets for secure environment management
3. **Database**: Configured with Neon PostgreSQL for serverless database
4. **Port Configuration**: Uses port 5000 for optimal Replit compatibility

### 🔧 Production Configuration
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Health Checks**: Built-in health monitoring endpoints
- **Auto-Scaling**: Optimized for Replit's scaling capabilities

## Installation Guide

### 📦 Step-by-Step Installation

1. **Fork the Replit Project**
   ```bash
   # Or clone manually
   git clone https://github.com/your-username/autoforwardx.git
   cd autoforwardx
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Generate and run migrations
   npm run db:generate
   npm run db:migrate
   ```

4. **Environment Configuration**
   - Set up Replit Secrets with required environment variables
   - Configure Telegram API credentials
   - Set up payment gateway credentials

5. **Start the Application**
   ```bash
   npm run dev
   ```

## JWT Authentication

### 🔐 Authentication Flow
1. **Phone Number Input**: User enters phone with country code
2. **OTP Verification**: Telegram sends verification code
3. **Account Creation/Login**: Create session or login existing user
4. **JWT Token Generation**: Secure token for API access
5. **Session Management**: Persistent login state

### 🛡️ Security Features
- **Bcrypt Password Hashing**: Secure password storage
- **JWT Token Expiration**: Automatic token refresh
- **Rate Limiting**: Prevent brute force attacks
- **Secure Headers**: CORS and security middleware

## Key Components

### 🏠 Landing Page (Home)
- **Hero Section**: Compelling value proposition with CTA
- **Feature Highlights**: Key benefits and capabilities
- **Pricing Overview**: Transparent pricing tiers
- **Testimonials**: Social proof and user reviews
- **Payment Methods**: PayPal and crypto support display

### 📋 Features Page
- **Comprehensive Feature List**: Detailed capability showcase
- **Benefit-Focused Content**: User-centric feature descriptions
- **Technical Specifications**: Advanced feature details
- **Integration Capabilities**: Third-party service connections

### 💳 Pricing Page
- **Tiered Pricing**: Free, Pro ($3.50/mo), Business ($9.50/mo)
- **Feature Comparison**: Clear feature differentiation
- **Payment Options**: Multiple payment method support
- **Upgrade Path**: Easy plan switching

### 📊 Dashboard
- **Statistics Overview**: Key performance metrics
- **Forwarding Pair Management**: Visual pair configuration
- **Real-Time Activity**: Live message forwarding status
- **Account Management**: Multi-account switching

## Login System

### 📱 Telegram Phone Authentication
The login system uses Telegram's native authentication:

1. **Country Code Selection**: Flag selector with country codes
2. **Phone Number Input**: Masked input with validation
3. **OTP Verification**: Direct Telegram OTP integration
4. **Account Linking**: Connect Telegram account to platform
5. **Session Creation**: Secure session establishment

### 🔄 Session Management
- **Persistent Sessions**: Maintain login state across browser sessions
- **Auto-Recovery**: Automatic session restoration on connection loss
- **Multi-Device Support**: Concurrent sessions on multiple devices
- **Session Health Monitoring**: Real-time session status tracking

## Mobile Optimization

### 📱 Responsive Design
- **Mobile-First Approach**: Optimized for mobile devices
- **Touch-Friendly Interface**: Large touch targets and gestures
- **Adaptive Layouts**: Flexible grid systems and components
- **Performance Optimized**: Lazy loading and code splitting

### 🎨 Mobile-Specific Features
- **Swipe Gestures**: Intuitive touch interactions
- **Mobile Navigation**: Collapsible sidebar and bottom navigation
- **Optimized Forms**: Mobile keyboard optimization
- **Offline Support**: Basic offline functionality

## Navigation Structure

### 🧭 Public Routes
- `/` - Landing page with hero and features
- `/features` - Comprehensive feature showcase
- `/pricing` - Pricing plans and comparison
- `/login` - Telegram phone authentication

### 🔒 Protected Routes
- `/dashboard` - Main user dashboard
- `/forwarding-pairs` - Forwarding pair management
- `/analytics` - Advanced analytics and reporting
- `/settings` - Account and preference settings

### 👑 Admin Routes
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/analytics` - System-wide analytics
- `/admin/settings` - Global system settings

## Order Processing

### 💰 Payment Flow
1. **Plan Selection**: User chooses pricing tier
2. **Payment Method**: PayPal or cryptocurrency selection
3. **Payment Processing**: Secure payment gateway integration
4. **Account Upgrade**: Immediate plan activation
5. **Confirmation**: Email and in-app notifications

### 📊 Subscription Management
- **Plan Upgrades/Downgrades**: Seamless plan switching
- **Billing History**: Transaction tracking and receipts
- **Auto-Renewal**: Automatic subscription renewal
- **Cancellation**: Easy subscription cancellation

## Payment Integration

### 💳 PayPal Integration
- **PayPal SDK**: Official PayPal JavaScript SDK
- **Subscription Support**: Recurring payment handling
- **Webhook Processing**: Real-time payment notifications
- **Refund Support**: Automated refund processing

### ₿ Cryptocurrency Payments (NowPayments)
- **Multi-Currency Support**: BTC, ETH, USDT, and more
- **Real-Time Rates**: Live cryptocurrency exchange rates
- **Payment Verification**: Blockchain transaction confirmation
- **Auto-Conversion**: Automatic fiat conversion

## Queue Management

### 📬 Message Queue System
- **Redis-Based Queue**: High-performance message queuing
- **Priority Processing**: Important message prioritization
- **Batch Processing**: Efficient bulk message handling
- **Dead Letter Queue**: Failed message handling

### 📊 Queue Monitoring
- **Real-Time Statistics**: Queue length and processing metrics
- **Performance Metrics**: Throughput and latency monitoring
- **Alert System**: Queue overflow and error notifications
- **Auto-Scaling**: Dynamic queue capacity adjustment

## Rate Limiting

### 🚦 Telegram API Limits
- **Flood Protection**: Prevent Telegram API flooding
- **Smart Throttling**: Adaptive rate limiting based on account status
- **Burst Handling**: Handle traffic spikes gracefully
- **Error Recovery**: Automatic retry with exponential backoff

### 🔒 Application Rate Limiting
- **User-Based Limits**: Per-user API rate limiting
- **IP-Based Protection**: IP-based request throttling
- **Plan-Based Quotas**: Feature limits based on subscription tier
- **Abuse Prevention**: Anti-spam and abuse protection

## Session Management

### 🔄 Telegram Session Handling
- **Multi-Session Support**: Multiple Telegram account connections
- **Session Persistence**: Maintain sessions across restarts
- **Health Monitoring**: Real-time session health checks
- **Auto-Recovery**: Automatic session restoration

### 📊 Session Analytics
- **Connection Statistics**: Session uptime and reliability metrics
- **Error Tracking**: Session-related error monitoring
- **Performance Metrics**: Session response time and throughput
- **Usage Patterns**: Session activity analysis

## Telegram API Integration

### 🤖 Bot API Features
- **Command Processing**: Handle bot commands and responses
- **Inline Keyboards**: Interactive button interfaces
- **File Handling**: Media and document forwarding
- **Group Management**: Channel and group administration

### 📡 MTProto Integration
- **Direct API Access**: Low-level Telegram protocol implementation
- **Real-Time Updates**: Live message and event streaming
- **Advanced Features**: Access to advanced Telegram features
- **Performance Optimization**: Optimized protocol handling

## User Management

### 👥 User Accounts
- **Profile Management**: User profile and preferences
- **Account Statistics**: Usage metrics and analytics
- **Plan Management**: Subscription and billing information
- **Security Settings**: Two-factor authentication and security options

### 🔐 Admin Management
- **User Administration**: User account management tools
- **System Monitoring**: Platform-wide monitoring and alerts
- **Content Moderation**: User content and behavior monitoring
- **Support Tools**: Customer support and ticket management

## Verification System

### ✅ Account Verification
- **Phone Verification**: Telegram phone number verification
- **Email Verification**: Optional email verification
- **Identity Verification**: KYC for high-tier plans
- **Bot Verification**: Telegram bot ownership verification

### 🛡️ Security Verification
- **Two-Factor Authentication**: TOTP-based 2FA
- **Device Verification**: New device login verification
- **API Key Verification**: Secure API access management
- **Payment Verification**: Payment method verification

## Workflow Management

### 🔄 Automated Workflows
- **Message Forwarding**: Automated message routing workflows
- **Content Processing**: Automated content filtering and processing
- **Notification Workflows**: Automated alert and notification systems
- **Backup Workflows**: Automated data backup and recovery

### 📋 Workflow Monitoring
- **Execution Tracking**: Workflow execution monitoring and logging
- **Performance Metrics**: Workflow efficiency and performance tracking
- **Error Handling**: Workflow error detection and recovery
- **Optimization**: Workflow performance optimization tools

## X-Factor Features

### 🌟 Unique Selling Points
- **History Cloning**: Clone message history between channels
- **Chain Forwarding**: Multi-level forwarding chains
- **Smart Watermarking**: Intelligent content watermarking
- **Global Announcements**: Admin broadcast to all users

### 🚀 Advanced Capabilities
- **Drag-and-Drop Setup**: Visual forwarding pair configuration
- **AI Content Filtering**: Machine learning-based content filtering
- **Custom Bot Commands**: User-defined bot command creation
- **Advanced Analytics**: Predictive analytics and insights

## Yak Shaving (Performance)

### ⚡ Performance Optimizations
- **Code Splitting**: Lazy loading for optimal bundle sizes
- **Database Indexing**: Optimized database query performance
- **Caching Strategy**: Redis-based caching for frequent data
- **CDN Integration**: Static asset delivery optimization

### 📊 Monitoring and Metrics
- **Application Performance Monitoring**: Real-time performance tracking
- **Error Tracking**: Comprehensive error monitoring and alerting
- **User Experience Metrics**: Core web vitals and user experience tracking
- **Resource Monitoring**: Server resource usage and optimization

## Zero-Downtime Features

### 🔄 High Availability
- **Graceful Shutdowns**: Zero-downtime deployments
- **Health Checks**: Automated health monitoring and recovery
- **Load Balancing**: Distributed load handling
- **Failover Systems**: Automatic failover and recovery

### 🛡️ Reliability Features
- **Database Replication**: Data redundancy and backup
- **Session Persistence**: Maintain user sessions during updates
- **Queue Persistence**: Message queue data persistence
- **Configuration Hot-Reload**: Runtime configuration updates

---

## 📞 Support & Contact

### 🆘 Getting Help
- **Documentation**: Comprehensive guides and tutorials
- **Community Support**: Discord/Telegram community channels
- **Technical Support**: Priority support for paid plans
- **Bug Reports**: GitHub issues and bug reporting

### 📧 Contact Information
- **Email**: support@autoforwardx.com
- **Telegram**: @AutoForwardXSupport
- **Website**: https://autoforwardx.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Telegram Team**: For providing robust API and platform
- **Open Source Community**: For the amazing tools and libraries
- **Beta Testers**: For valuable feedback and bug reports
- **Replit Team**: For the excellent hosting platform

---

**AutoForwardX** - *Automate Your Telegram Forwarding with Intelligence*
