# MenuMaster - Restaurant Menu Management System

## Overview

MenuMaster is a web application for restaurant menu management. It allows restaurant owners to create digital menus, customize their appearance using templates, manage items and categories, and generate QR codes for customers to access menus.

The application is built with:
- **Frontend**: React, Tailwind CSS, shadcn/ui component library
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is a React single-page application using:
- React for UI components and state management
- TanStack (React) Query for data fetching and caching
- Wouter for routing (lightweight alternative to React Router)
- Tailwind CSS for styling
- Shadcn/UI for UI components (built on Radix UI primitives)
- TypeScript for type safety

The frontend is organized into:
- `client/src/pages`: Page components for different routes
- `client/src/components`: Reusable UI components
- `client/src/hooks`: Custom React hooks for shared logic
- `client/src/lib`: Utility functions and configurations

### Backend Architecture

The backend is a Node.js Express server that:
- Serves the static frontend assets in production
- Provides a REST API for the frontend
- Handles authentication via Replit Auth
- Manages database operations through Drizzle ORM

The backend structure includes:
- `server/index.ts`: Main server entry point
- `server/routes.ts`: API route definitions
- `server/db.ts`: Database configuration
- `server/storage.ts`: Data access layer
- `server/replitAuth.ts`: Authentication handling

### Database Architecture

The application uses PostgreSQL with Drizzle ORM for database operations. The schema is defined in `shared/schema.ts` and includes models for:
- Users
- Restaurants
- Menu templates
- Categories
- Menu items
- Allergens
- QR codes
- Analytics data

### Authentication

Authentication is implemented using Replit Auth (OpenID Connect), which provides:
- User authentication via Replit accounts
- Session management
- User profile information

## Key Components

### Restaurant Management

Allows users to:
- Create new restaurants
- Edit restaurant details (name, location, logo)
- Delete restaurants
- Assign menu templates

### Menu Editor

Provides functionality to:
- Create and organize menu categories
- Add, edit, and remove menu items
- Set item prices and descriptions
- Mark allergens for menu items

### Template System

Enables users to:
- Choose from predefined menu templates
- Customize template appearance
- Preview menu layouts

### QR Code Generation

Allows restaurant owners to:
- Generate QR codes for their digital menus
- Track QR code scans and analytics

### Allergen Management

Facilitates compliance with food safety regulations by:
- Managing a database of common allergens
- Tagging menu items with relevant allergens
- Displaying allergen information on menus

## Data Flow

1. **Authentication Flow**:
   - User logs in via Replit Auth
   - Backend verifies credentials and creates a session
   - User is redirected to the dashboard

2. **Restaurant Creation Flow**:
   - User creates a restaurant from the dashboard
   - Data is sent to the server via the API
   - Database record is created
   - Updated restaurant list is returned to the client

3. **Menu Editing Flow**:
   - User selects a restaurant to edit its menu
   - Categories and items are loaded from the database
   - User makes changes in the menu editor
   - Changes are saved to the database via API calls

4. **Customer Menu Viewing Flow**:
   - Customer scans restaurant QR code
   - Browser opens menu URL with restaurant subdomain
   - Server retrieves menu data for the specific restaurant
   - Menu is rendered with the associated template

## External Dependencies

### Frontend Dependencies
- React ecosystem: React, React DOM
- UI components: shadcn/ui, Radix UI primitives
- Data fetching: TanStack Query
- Routing: Wouter
- Forms: React Hook Form, Zod
- Styling: Tailwind CSS, class-variance-authority

### Backend Dependencies
- Server: Express
- Database: Drizzle ORM with PostgreSQL (via Neon serverless)
- Authentication: OpenID Client
- Session management: Express Session, connect-pg-simple
- File uploads: Multer
- Image processing: Sharp
- QR code generation: qrcode

## Deployment Strategy

The application is configured for deployment on Replit with:

1. **Build Process**:
   - Frontend is built with Vite
   - Backend is bundled with esbuild
   - Static assets are served from the `dist/public` directory

2. **Database**:
   - PostgreSQL 16 is used as the database
   - Connection is managed through the DATABASE_URL environment variable
   - Drizzle handles database schema and migrations

3. **Environment Variables**:
   - DATABASE_URL: PostgreSQL connection string
   - SESSION_SECRET: For securing sessions
   - REPLIT_DOMAINS: For authentication
   - REPL_ID: For Replit-specific functionality

4. **Hosting**:
   - The application is configured for autoscaling deployment
   - Express serves both the API and static frontend assets

5. **Development Workflow**:
   - `npm run dev`: Starts development server
   - `npm run build`: Builds for production
   - `npm run start`: Starts production server
   - `npm run db:push`: Updates database schema

## Development Guidelines

When extending this application:

1. **Adding new API endpoints**:
   - Add route handlers in `server/routes.ts`
   - Implement storage operations in `server/storage.ts`
   - Add client-side data fetching using TanStack Query

2. **Adding new UI components**:
   - Follow the shadcn/ui pattern for consistent design
   - Place shared components in `client/src/components`
   - Use Tailwind for styling

3. **Database schema changes**:
   - Update models in `shared/schema.ts`
   - Create migrations using Drizzle Kit
   - Run migrations during deployment

4. **Authentication & Authorization**:
   - Use the existing Replit Auth setup
   - Implement role-based access using the `isAdmin` field in the user model
   - Secure API routes with appropriate middleware