# AutoForwardX - Telegram Message Forwarding Application

## Overview

AutoForwardX is a full-stack web application designed for managing Telegram message forwarding operations. The system allows users to create and manage forwarding pairs between Telegram channels, monitor activity, and control forwarding behavior with customizable settings like delays, copy modes, and silent forwarding.

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

### Authentication System
- JWT-based authentication with secure token storage
- User registration and login functionality
- Protected route middleware for API endpoints
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

- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.