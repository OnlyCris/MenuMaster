# MenuMaster - Project Overview

## Project Status
**Current Version**: 1.5.0  
**Status**: Production Ready  
**Last Updated**: January 2025  

## Overview
MenuMaster is a comprehensive SaaS platform for restaurant digital menu management with advanced analytics, multi-language support, and customer support system.

**GitHub Repository**: https://github.com/OnlyCris/MenuMaster

## Recent Changes
- ✅ **January 2025**: Project pushed to GitHub repository: https://github.com/OnlyCris/MenuMaster
- ✅ **January 2025**: Updated all documentation with correct repository URLs
- ✅ **January 2025**: Completed debian-installer.sh with SSL, PM2, firewall, monitoring, and backup systems
- ✅ **January 2025**: Fixed supportTickets database import and table creation in installation scripts
- ✅ **January 2025**: Fixed dashboard navigation links (changed /dashboard to /)
- ✅ **January 2025**: Complete support ticket system with admin management panel
- ✅ **January 2025**: Mobile optimization for all admin pages (analytics, support, invitations)
- ✅ **January 2025**: Complete /help page with FAQ system and ticket creation
- ✅ **January 2025**: Enhanced template preview system with live mock data visualization
- ✅ **January 2025**: Restaurant-specific analytics dashboard with detailed metrics and charts
- ✅ **January 2025**: Multi-language support with automatic translation and tracking
- ✅ **January 2025**: Complete documentation and installation guides created
- ✅ **December 2024**: Fixed database connectivity issues and SSL certificate problems
- ✅ **December 2024**: Stripe payment integration with dynamic API key loading
- ✅ **December 2024**: Translation API errors resolved with silent fallback system

## Project Architecture

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: TailwindCSS + Shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight routing
- **Forms**: React Hook Form with Zod validation

### Backend  
- **Runtime**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with bcrypt password hashing
- **File Uploads**: Multer with local storage
- **External APIs**: Stripe, SendGrid, Google Translate, Cloudflare

### Database Schema
- **Users**: Authentication and profiles with admin roles
- **Restaurants**: Multi-tenant restaurant management
- **Templates**: Customizable menu templates with CSS styling
- **Categories & Menu Items**: Hierarchical menu structure
- **Allergens**: Many-to-many relationship with menu items
- **Analytics**: Visit tracking and performance metrics
- **Support Tickets**: Customer support system
- **QR Codes**: Generated codes for restaurant tables

## Key Features Implemented

### Core Functionality
- ✅ Multi-restaurant management per user
- ✅ 5 professional templates with live preview
- ✅ Menu editor with categories, items, and allergens
- ✅ Image upload for restaurant logos and menu items
- ✅ QR code generation for restaurant tables
- ✅ Custom subdomain creation (restaurant.menuisland.it)

### Analytics System
- ✅ Dashboard with aggregated metrics across all restaurants
- ✅ Restaurant-specific analytics with detailed charts
- ✅ Menu item view tracking with language statistics
- ✅ QR code scan tracking and conversion rates
- ✅ Time-series data visualization with recharts

### Multi-language Support
- ✅ 10 supported languages (IT, EN, FR, DE, ES, PT, RU, ZH, JA, AR)
- ✅ Google Translate API integration (optional)
- ✅ Browser language detection
- ✅ Language usage analytics and tracking
- ✅ Silent fallback system for translation errors

### Support System
- ✅ Customer ticket system with priority levels
- ✅ Admin support dashboard with response management
- ✅ Email notifications for ticket updates
- ✅ FAQ and knowledge base integration
- ✅ Multi-channel support (email, chat, tickets)

### Payment Integration
- ✅ Stripe payment processing for premium plans
- ✅ Freemium model (1 restaurant free, unlimited paid)
- ✅ Admin dashboard for payment management
- ✅ Dynamic API key configuration

### Admin Features
- ✅ User management with role-based access
- ✅ Restaurant oversight and analytics
- ✅ Support ticket management
- ✅ Email template customization
- ✅ System statistics and monitoring

## Technical Specifications

### Performance
- Database queries optimized with proper indexing
- Image compression and optimization for uploads
- Responsive design optimized for mobile devices
- Server-side rendering for menu pages
- Caching strategies for frequently accessed data

### Security
- HTTPS enforcement with SSL certificates
- Password hashing with bcrypt
- CSRF protection and input validation
- Rate limiting on API endpoints
- SQL injection prevention with parameterized queries

### Deployment
- VPS deployment with PM2 process management
- Nginx reverse proxy with SSL termination
- PostgreSQL database with automated backups
- Cloudflare integration for DNS and CDN
- Environment-based configuration management

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint and Prettier for code formatting
- Functional components with React hooks
- Consistent naming conventions (camelCase, PascalCase)
- Comprehensive error handling and logging

### Database Operations
- Use Drizzle ORM for all database interactions
- Always use transactions for multi-table operations
- Implement proper foreign key constraints
- Regular database migrations via `npm run db:push`

### API Design
- RESTful endpoints with proper HTTP methods
- Consistent error response format
- Input validation with Zod schemas
- Authentication middleware for protected routes

## User Preferences
*None specified yet - will be updated based on user feedback*

## Known Issues & Solutions
- **Template previews**: Fixed with new TemplatePreview component using mock data
- **Database connections**: Resolved with proper PostgreSQL configuration
- **Mobile responsiveness**: Enhanced with mobile-first design approach
- **Translation errors**: Silent fallback system prevents console spam

## Deployment Information

### Production Environment
- **Hosting**: VPS with Ubuntu 20.04+
- **Process Manager**: PM2 with cluster mode
- **Web Server**: Nginx with SSL termination
- **Database**: PostgreSQL 14+ with connection pooling
- **Monitoring**: PM2 monitoring + custom logging

### Environment Variables Required
```
DATABASE_URL=postgresql://user:pass@host:port/db
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
SENDGRID_API_KEY=SG...
CLOUDFLARE_API_TOKEN=...
SESSION_SECRET=...
```

### Build Process
```bash
npm install
VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY npm run build
npm run db:push
pm2 start ecosystem.config.js
```

## Documentation
- ✅ Complete API documentation with examples
- ✅ User guide with step-by-step instructions
- ✅ Installation guide for private server deployment
- ✅ Technical architecture documentation
- ✅ Troubleshooting guide with common issues

## Future Roadmap
- **Q2 2024**: Mobile app (iOS/Android)
- **Q2 2024**: POS system integrations
- **Q3 2024**: Online reservation system
- **Q3 2024**: Staff management portal
- **Q4 2024**: AI-powered menu optimization

---

*This project represents a complete, production-ready SaaS solution for restaurant digital menu management with enterprise-grade features and comprehensive documentation.*