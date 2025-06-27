# AutoForwardX - Telegram Message Forwarding Application

## Overview

AutoForwardX is a comprehensive web platform for automated Telegram message forwarding with a modern dark-themed interface. The system includes a marketing landing page, detailed features showcase, Telegram phone authentication, and a full dashboard for managing forwarding operations between channels with advanced customization options.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme variables
- **Build Tool**: Vite with hot module replacement in development

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JWT-based authentication
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via Neon serverless)
- **Session Management**: JWT tokens with bcrypt password hashing

### Database Schema
The application uses three main entities:
- **Users**: Stores user credentials, plans, and connected Telegram accounts
- **Forwarding Pairs**: Manages channel forwarding configurations with timing and behavior settings
- **Activity Logs**: Tracks all system activities and forwarding operations

## Key Components

### Public Pages & Marketing
- **Landing Page**: Modern dark-themed homepage with hero section, feature highlights, pricing overview, and testimonials
- **Features Page**: Comprehensive feature showcase organized in categories with detailed descriptions and benefits
- **SEO Optimization**: Meta tags, structured content, and mobile-responsive design

### Authentication System
- **Telegram Phone Authentication**: Multi-step login flow with country code selection, OTP verification, and account setup
- **Legacy JWT Support**: Maintained for backward compatibility with existing API endpoints
- Protected route middleware for dashboard access
- Client-side auth context for user state management

### Forwarding Management
- Create, edit, and delete forwarding pairs
- Toggle active/inactive states for forwarding operations
- Configurable delay settings (instant to hours)
- Copy mode and silent mode options
- Real-time status monitoring

### Dashboard Interface
- Statistics overview with key metrics
- Visual representation of forwarding pairs
- Activity feed showing recent operations
- Responsive design with mobile support

### Storage Layer
- Abstract storage interface (IStorage) for database operations
- In-memory storage implementation for development/testing
- PostgreSQL integration through Drizzle ORM
- Type-safe database queries with Zod validation

## Data Flow

1. **User Authentication**: Users authenticate via login form, receiving JWT tokens stored in localStorage
2. **Dashboard Loading**: Authenticated users fetch dashboard stats, forwarding pairs, and activity logs
3. **Forwarding Operations**: Users create/modify forwarding pairs through modal forms
4. **Real-time Updates**: React Query manages cache invalidation and automatic refetching
5. **Activity Tracking**: All operations are logged to the activity_logs table for monitoring

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **Routing & State**: Wouter, TanStack Query
- **Database**: Drizzle ORM, Neon Database serverless connector
- **Authentication**: JWT, bcrypt for password hashing
- **UI Components**: Comprehensive Radix UI component collection
- **Validation**: Zod for runtime type checking and validation

### Development Dependencies
- **Build Tools**: Vite, ESBuild for production builds
- **TypeScript**: Full TypeScript support with strict mode
- **Development**: TSX for TypeScript execution, hot reload capabilities

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit integration
- **Database**: PostgreSQL 16 module
- **Build Process**: `npm run dev` starts development server with hot reload
- **Port Configuration**: Application runs on port 5000

### Production Deployment
- **Build Command**: `npm run build` - Vite builds client, ESBuild bundles server
- **Start Command**: `npm run start` - Runs production build
- **Deployment Target**: Autoscale deployment on Replit
- **Database**: Production PostgreSQL via DATABASE_URL environment variable

### Environment Configuration
- **Database**: Requires DATABASE_URL environment variable
- **JWT Secret**: Configurable via JWT_SECRET environment variable
- **Static Assets**: Served from dist/public directory in production

## Changelog

- June 27, 2025: Initial setup with dashboard and authentication
- June 27, 2025: Added landing page and features showcase with Telegram phone authentication

## Recent Changes

✓ Landing Page: Modern dark-themed homepage with hero section, pricing, testimonials
✓ Features Page: Comprehensive showcase of all platform capabilities organized by category  
✓ Telegram Authentication: Multi-step phone verification flow with country code selection
✓ Updated Routing: Added public marketing pages alongside protected dashboard
✓ Payment Integration: Clear presentation of PayPal and crypto payment options
✓ Feature Comparison Table: Interactive table showing all features across Free/Pro/Business plans
✓ Dedicated Pricing Page: Complete pricing page with FAQ section and payment methods
✓ Navigation Enhancement: Added pricing page links across all marketing pages
✓ Enhanced Forwarding UI: Three-panel layout with channel selector and improved status indicators
✓ Channel Management: Multi-select interface with search, status badges, and drag-drop functionality  
✓ Advanced Forwarding Cards: Enhanced cards with status indicators, quick actions, and detailed metrics
✓ Attractive Design Implementation: Gradient backgrounds, animated elements, and sophisticated card layouts
✓ Modern Channel Selector: Three-panel layout with source/destination selection and visual flow indicators
✓ Enhanced Visual Appeal: Professional dark theme with blue/purple gradients matching user design reference
✓ Comprehensive Telegram Forwarding System: Complete backend implementation with database, session management, queue processing, and API endpoints
✓ Database Migration: Migrated from memory storage to PostgreSQL with full schema for users, sessions, forwarding pairs, blocking, and queue management
✓ Telegram Integration: Built complete Telegram client with OTP authentication, session health monitoring, and message forwarding capabilities
✓ Rate Limiting & Queue System: Implemented sophisticated message queue with rate limiting, retry logic, and failure handling
✓ Session Management: Real-time session health checks, automatic recovery, and multi-account support per user
✓ Advanced Blocking: Text-based and image-based message filtering with per-pair and global blocking rules
✓ Comprehensive API: Complete REST API covering all aspects of Telegram forwarding, session management, and system monitoring
✓ Complete Admin Panel: Full-featured admin dashboard with dark theme, real-time monitoring, and comprehensive management tools
✓ Advanced User Management: Bulk operations, advanced filtering, user analytics, and CSV export functionality
✓ System Monitoring: Real-time metrics for server health, database performance, Telegram API status, and queue management
✓ Advanced Analytics: Revenue tracking, usage patterns, user growth metrics, and geographic distribution analysis
✓ Error Management: Comprehensive error tracking, classification, and resolution system with admin oversight
✓ Content Moderation: Advanced filtering system with automated content management and manual admin controls
✓ Real Telegram API Integration: Replaced mock implementation with authentic MTProto connectivity using official Telegram API credentials
✓ Authentic Phone Verification: Implemented real OTP sending and verification through Telegram servers for genuine account authentication
✓ Production-Ready Authentication: System now connects to actual Telegram infrastructure for reliable user onboarding and session management
✓ Admin Panel PIN Authentication: Implemented secure PIN-protected admin login system with PIN 5599 for administrative access
✓ Admin Dashboard Enhancement: Updated admin panel with proper authentication flow, logout functionality, and admin-specific API endpoints
✓ Telegram API Configuration: Configured authentic Telegram API credentials (API ID: 23697291, API Hash: b3a10e33ef507e864ed7018df0495ca8) for production connectivity
✓ Replit Migration: Successfully migrated from Replit Agent to standard Replit environment with database connectivity and dependency resolution
✓ Joined Channel Selector: Built comprehensive channel management interface with search, multi-select, drag-drop pairing, and real-time status indicators
✓ Per-Pair Task Controls: Implemented individual forwarding pair management with pause/resume/stop controls and real-time settings editing
✓ Bulk Management Tools: Created bulk operations system for mass pair creation, editing, pausing/resuming, and CSV export functionality
✓ Analytics & Reporting: Developed comprehensive analytics dashboard with exportable CSV/PDF reports and advanced filtering capabilities
✓ Multi-Language Bot Support: Implemented complete bot internationalization supporting English, Spanish, and Hindi with dynamic language switching
✓ Webhook & API Management: Built robust webhook event system and API key management with rate limiting and third-party integration support
✓ Anti-Ban Safety System: Created intelligent rate limit monitoring with auto-throttling, emergency stops, and adaptive forwarding speed control
✓ SEO & Blog Management: Implemented full blog CMS with SEO optimization, sitemap generation, meta tag management, and search console integration

## User Preferences

Preferred communication style: Simple, everyday language.