# TechTammina CRM System

**Delivering Excellence in Sales Management**

A comprehensive Customer Relationship Management (CRM) system built with modern technologies for sales teams who demand excellence. This enterprise-grade CRM provides complete sales lifecycle management with advanced features for lead management, deal tracking, customer service, and business analytics.

## 🏗️ Architecture

### Integrated Full-Stack Application
- **Backend**: Spring Boot 3.5.5 (Java 17) serving REST APIs
- **Frontend**: React 18 + TypeScript with Vite build system
- **Database**: MySQL 8.0+ with JPA/Hibernate ORM
- **Build**: Maven with Frontend Plugin for seamless integration
- **Deployment**: Single JAR file containing both frontend and backend
- **Security**: JWT-based authentication with role-based access control
- **Communication**: Integrated email and VoIP calling capabilities

### Project Structure
```
TechTamminaCRM/
├── crm-customer-service/           # Spring Boot Backend
│   ├── src/main/java/com/techtammina/crm/
│   │   ├── config/                 # Security, CORS, JWT configuration
│   │   ├── controller/             # REST API endpoints (50+ controllers)
│   │   ├── dto/                    # Data Transfer Objects
│   │   ├── entity/                 # JPA entities (60+ entities)
│   │   ├── repository/             # Data access layer
│   │   ├── service/                # Business logic layer (40+ services)
│   │   ├── util/                   # Utility classes
│   │   └── exception/              # Global exception handling
│   ├── src/main/resources/
│   │   ├── application.properties  # Main configuration
│   │   ├── application-dev.properties    # Development profile
│   │   ├── application-PROD.properties   # Production profile
│   │   └── static/                 # React build output location
│   ├── logs/                       # Application logs
│   ├── target/                     # Maven build output
│   └── pom.xml                     # Maven dependencies & build config
├── crm-react/                      # React Frontend
│   ├── src/
│   │   ├── api/                    # API service layer (25+ API modules)
│   │   ├── components/             # Reusable UI components
│   │   ├── modules/                # Feature-specific modules
│   │   │   ├── leads/              # Lead management
│   │   │   ├── deals/              # Deal pipeline
│   │   │   ├── accounts/           # Account management
│   │   │   ├── contacts/           # Contact management
│   │   │   ├── tasks/              # Task management
│   │   │   ├── dashboard/          # Analytics dashboard
│   │   │   ├── communication/      # Email & calling
│   │   │   ├── documents/          # Document management
│   │   │   ├── reports/            # Reporting & analytics
│   │   │   ├── service/            # Customer service
│   │   │   ├── marketing/          # Marketing automation
│   │   │   ├── workflows/          # Business process automation
│   │   │   └── settings/           # System configuration
│   │   ├── routes/                 # Application routing
│   │   ├── lib/                    # Redux store & slices
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── utils/                  # Helper functions
│   │   └── types/                  # TypeScript definitions
│   ├── public/                     # Static assets & sample data
│   ├── node/                       # Node.js runtime (managed by Maven)
│   └── package.json                # Node.js dependencies
├── logs/                           # Application logs directory
├── start-dev.bat                   # Development mode startup
├── start-prod.bat                  # Production mode startup
└── start-crm-prod.bat             # Optimized production startup
```

## 🚀 Technology Stack

### Backend Technologies
- **Framework**: Spring Boot 3.5.5
- **Language**: Java 17 (LTS)
- **Database**: MySQL 8.0+ with JPA/Hibernate ORM
- **Security**: Spring Security + JWT Authentication (JJWT 0.11.5)
- **Email**: Spring Mail with Gmail SMTP integration
- **VoIP**: Asterisk Java 3.39.0 for telephony integration
- **File Processing**: Apache POI 5.2.4 for Excel operations
- **Build Tool**: Maven 3.6+ with Frontend Maven Plugin
- **Validation**: Spring Boot Validation with custom validators
- **Logging**: Logback with structured logging and file rotation
- **Memory Management**: Optimized JVM settings with G1GC
- **Monitoring**: Health checks and performance monitoring

### Frontend Technologies
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 4.5.0 (fast development and optimized builds)
- **Styling**: Tailwind CSS 3.3.5 with custom design system
- **State Management**: Redux Toolkit + React Query (TanStack Query 5.8.4)
- **Routing**: React Router DOM 6.20.1
- **Forms**: React Hook Form 7.48.2 + Zod validation
- **UI Components**: 
  - Custom component library with Framer Motion 10.16.5
  - Lucide React icons
  - React Beautiful DnD for drag & drop
- **Charts & Analytics**: Recharts 2.8.0 for data visualization
- **File Handling**: XLSX library for Excel operations
- **HTTP Client**: Axios 1.12.2 with interceptors
- **Notifications**: React Hot Toast for user feedback
- **PWA**: Service Worker support with Vite PWA plugin

### Integration & Communication
- **Telephony**: 
  - Asterisk SIP integration for internal calling
  - Click-to-call functionality
  - Call logging and recording
- **Email System**: 
  - SMTP integration with Gmail
  - Email templates and automation
  - Email tracking and threading
- **File Management**: 
  - Excel import/export for bulk operations
  - Document upload and management
  - File versioning and sharing
- **Real-time Features**: 
  - Live notifications
  - Real-time dashboard updates
  - Activity timeline tracking
- **Security**: 
  - CORS configuration for secure cross-origin requests
  - JWT token management with refresh tokens
  - Role-based access control (RBAC)
  - Input validation and sanitization

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, Linux, or macOS
- **Java**: JDK 17 or higher (LTS recommended)
- **Node.js**: 18.17.0+ (automatically managed by Maven Frontend Plugin)
- **MySQL**: 8.0 or higher with InnoDB engine
- **Maven**: 3.6+ (or use included wrapper mvnw.cmd)
- **Memory**: 
  - Development: Minimum 4GB RAM (8GB recommended)
  - Production: Minimum 8GB RAM (16GB recommended)
- **Storage**: 
  - Development: 3GB free space
  - Production: 5GB free space for logs and data
- **Network**: Internet connection for dependency downloads

### Development Tools (Optional)
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code
- **Database Client**: MySQL Workbench, DBeaver, or similar
- **API Testing**: Postman or similar REST client

## 🛠️ Installation & Setup

### 1. Database Configuration

```sql
-- Create database
CREATE DATABASE crm_test;

-- Create user (optional)
CREATE USER 'crms'@'%' IDENTIFIED BY 'passw0rd';
GRANT ALL PRIVILEGES ON crm_test.* TO 'crms'@'%';
FLUSH PRIVILEGES;
```

### 2. Application Configuration

The application uses profile-based configuration. Main configuration files:

#### Development Profile (`application-dev.properties`):
```properties
# Server Configuration
server.port=8081
server.address=0.0.0.0

# Database Configuration (Development)
spring.datasource.url=jdbc:mysql://30.0.0.78:3306/crm_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata
spring.datasource.username=crms
spring.datasource.password=passw0rd
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=false
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

# JWT Configuration
jwt.secret=mySecretKey12345678901234567890123456789012345678901234567890
jwt.expiration=86400000

# Email Configuration (Gmail)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=crms-noreply@tammina.in
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# File Upload Configuration
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Document Management
document.upload.directory=uploads/documents/
document.allowed.extensions=pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,txt
document.max.file.size=10485760

# Asterisk VoIP Configuration
asterisk.host=30.0.0.80
asterisk.port=5038
asterisk.username=crmuser
asterisk.password=crmsecret
asterisk.timeout=30000
asterisk.context=from-internal

# Performance Optimization
server.tomcat.threads.max=50
server.tomcat.max-connections=2048
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=3
```

#### Production Profile (`application-PROD.properties`):
- Optimized for production environment
- Enhanced security settings
- Performance tuning parameters
- Production database configuration

### 3. Build & Run

#### Option A: Development Mode (Recommended for Development)
```bash
# One-click development startup
start-dev.bat
```
This script:
- Sets development profile (`spring.profiles.active=dev`)
- Builds the application with optimized settings
- Starts with development JVM parameters (1GB-2GB heap)
- Enables detailed logging for debugging

#### Option B: Production Mode
```bash
# Production startup with optimizations
start-crm-prod.bat
```
This script:
- Sets production profile (`spring.profiles.active=prod`)
- Builds with production optimizations
- Starts with production JVM parameters (2GB-4GB heap)
- Enables G1GC with performance tuning
- Structured logging with file rotation

#### Option C: Manual Build & Run
```bash
# Navigate to backend directory
cd crm-customer-service

# Clean build with React integration
mvnw.cmd clean package -DskipTests -U

# Run with specific profile
java -jar target/crm-customer-service-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
```

#### Option D: Development with Hot Reload
```bash
# Backend with auto-restart
cd crm-customer-service
mvnw.cmd spring-boot:run -Dspring.profiles.active=dev

# Frontend with hot reload (separate terminal)
cd crm-react
npm install
npm run dev  # Runs on http://localhost:4201
```

#### Build Process Details
1. **Frontend Build**: Maven Frontend Plugin builds React app using Vite
2. **Resource Copy**: Built React files copied to `src/main/resources/static/`
3. **Backend Build**: Spring Boot packages everything into executable JAR
4. **Result**: Single JAR file containing full-stack application

## 🌐 Access Points

### Application URLs
- **Main Application**: http://localhost:8081
- **Login Page**: http://localhost:8081/login
- **Dashboard**: http://localhost:8081/dashboard

### API Endpoints
- **Base API**: http://localhost:8081/api
- **Authentication**: http://localhost:8081/api/auth/login
- **Leads API**: http://localhost:8081/api/leads
- **Deals API**: http://localhost:8081/api/deals
- **Accounts API**: http://localhost:8081/api/accounts
- **Contacts API**: http://localhost:8081/api/contacts
- **Tasks API**: http://localhost:8081/api/tasks

### Health & Monitoring
- **Application Health**: http://localhost:8081/api/health
- **Database Health**: http://localhost:8081/api/health/database
- **Memory Health**: http://localhost:8081/api/health/memory
- **System Diagnostics**: Available in admin dashboard

### Development URLs (when running frontend separately)
- **React Dev Server**: http://localhost:4201
- **Vite HMR**: WebSocket on ws://localhost:4201

## 🎯 Core Features

### 📊 Sales Management
- **Lead Management**: 
  - Lead capture from multiple sources (web forms, imports, manual entry)
  - Lead qualification and scoring
  - Automated lead assignment and distribution
  - Lead conversion to accounts and contacts
  - Lead source tracking and analytics
- **Deal Pipeline**: 
  - Visual Kanban-style deal tracking
  - Customizable deal stages and probabilities
  - Deal forecasting and revenue projections
  - Stage transition automation and notifications
  - Deal document management
- **Account & Contact Management**: 
  - Comprehensive company and contact profiles
  - Relationship mapping and hierarchy
  - Account type management (lead, prospect, customer, partner, vendor)
  - Contact role and influence tracking
  - Account health scoring

### 🔄 CRM Lifecycle Automation
- **Intelligent Type Management**: 
  - Automatic progression: Lead → Prospect → Customer
  - Lead conversion automatically sets account type to 'prospect'
  - Deal closure (Closed_Won) upgrades accounts/contacts to 'customer'
  - Partner and vendor relationship management
- **Status Automation**: 
  - Active, inactive, archived status tracking
  - Automated status updates based on activity
  - Manual relationship deactivation capabilities
- **Business Rules Engine**: 
  - Configurable workflow automation
  - Trigger-based actions and notifications
  - Data validation and integrity checks

### 📞 Communication Hub
- **Integrated Email System**: 
  - Send/receive emails within CRM interface
  - Email threading and conversation tracking
  - Email templates and automation
  - Email activity logging and analytics
- **VoIP Integration**: 
  - Click-to-call functionality with Asterisk
  - Call logging and recording
  - Call queue management
  - Call analytics and reporting
- **Task & Activity Management**: 
  - Task creation, assignment, and tracking
  - Activity timeline and history
  - Automated follow-up reminders
  - Team collaboration features

### 📈 Analytics & Business Intelligence
- **Real-time Dashboard**: 
  - Customizable widgets and metrics
  - Sales performance KPIs
  - Pipeline health indicators
  - Revenue and conversion analytics
- **Advanced Reporting**: 
  - Pre-built and custom reports
  - Sales forecasting and trend analysis
  - Team and individual performance metrics
  - Export capabilities (Excel, PDF)
- **Data Visualization**: 
  - Interactive charts and graphs
  - Revenue tracking and projections
  - Lead source effectiveness analysis
  - Deal progression analytics

### 🛠️ Administration & Configuration
- **User Management**: 
  - Role-based access control (IT Admin, Sales VP, Manager, Executive)
  - User provisioning and deactivation
  - Permission management and security
  - Team hierarchy and reporting structure
- **Document Management**: 
  - File upload and organization
  - Document versioning and sharing
  - Folder structure management
  - Document templates and automation
- **System Configuration**: 
  - Email templates and automation rules
  - Workflow configuration and management
  - System settings and preferences
  - Integration management

### 🎯 Customer Service
- **Case Management**: 
  - Support ticket creation and tracking
  - SLA management and monitoring
  - Case escalation and routing
  - Customer satisfaction tracking
- **Knowledge Base**: 
  - Article management and search
  - FAQ and documentation system
  - Content categorization and tagging
  - User access and permissions

### 🚀 Marketing Automation
- **Campaign Management**: 
  - Email campaign creation and execution
  - Campaign performance tracking
  - Lead nurturing workflows
  - A/B testing capabilities
- **Lead Generation**: 
  - Web form integration
  - Landing page management
  - Lead scoring and qualification
  - Source attribution and tracking

### 📱 Modern User Experience
- **Responsive Design**: Mobile and desktop compatibility
- **Progressive Web App**: Offline capabilities and app-like experience
- **Real-time Updates**: Live notifications and data synchronization
- **Intuitive Interface**: Modern, clean design with excellent usability

## 👥 User Roles & Permissions

### Role-Based Access Control (RBAC)

| Role | Access Level | Key Permissions | Typical Use Cases |
|------|-------------|-----------------|-------------------|
| **IT Admin** | System-wide | • Full system access and configuration<br>• User management and provisioning<br>• System settings and integrations<br>• Database and security management<br>• Audit logs and system monitoring | System administration, user setup, security management, system maintenance |
| **Sales VP** | Organization-wide | • Complete sales organization visibility<br>• All reports and analytics<br>• Team performance oversight<br>• Strategic planning and forecasting<br>• Revenue and pipeline management | Executive oversight, strategic planning, organization-wide reporting, performance management |
| **Sales Manager** | Team-level | • Team member management<br>• Lead assignment and distribution<br>• Team performance reports<br>• Deal approval workflows<br>• Territory and quota management | Team leadership, performance coaching, lead distribution, team reporting |
| **Sales Executive** | Individual-level | • Personal lead and deal management<br>• Contact and account management<br>• Task and activity tracking<br>• Personal performance metrics<br>• Customer communication | Day-to-day sales activities, customer relationship management, personal productivity |

### Permission Matrix

| Feature | IT Admin | Sales VP | Sales Manager | Sales Executive |
|---------|----------|----------|---------------|----------------|
| **User Management** | ✅ Full | ❌ View Only | ❌ Team Only | ❌ None |
| **Lead Management** | ✅ All Leads | ✅ All Leads | ✅ Team Leads | ✅ Assigned Leads |
| **Deal Management** | ✅ All Deals | ✅ All Deals | ✅ Team Deals | ✅ Own Deals |
| **Account Management** | ✅ All Accounts | ✅ All Accounts | ✅ Team Accounts | ✅ Assigned Accounts |
| **Reporting** | ✅ All Reports | ✅ All Reports | ✅ Team Reports | ✅ Personal Reports |
| **System Settings** | ✅ Full Access | ❌ None | ❌ None | ❌ None |
| **Email Templates** | ✅ Manage All | ✅ View All | ✅ Team Templates | ✅ Use Only |
| **Workflow Management** | ✅ Configure | ✅ View | ❌ Limited | ❌ None |
| **Document Management** | ✅ All Documents | ✅ All Documents | ✅ Team Documents | ✅ Own Documents |
| **Analytics Dashboard** | ✅ System-wide | ✅ Organization | ✅ Team View | ✅ Personal View |

## 🔧 Development Architecture

### Backend Architecture (Spring Boot)

#### Layer Structure
- **Controllers** (50+ REST endpoints): 
  - `AuthController`, `LeadController`, `DealController`, `AccountController`
  - `ContactController`, `TaskController`, `DashboardController`
  - `EmailController`, `DocumentController`, `ReportsController`
  - Role-specific controllers: `SalesVPController`, `SalesManagerController`
- **Services** (40+ business services): 
  - Core business logic and workflow automation
  - `CrmLifecycleService` for automated type/status management
  - `EmailService`, `AsteriskService` for integrations
  - `AnalyticsService`, `ReportsService` for business intelligence
- **Repositories** (60+ data access): 
  - JPA repositories with custom queries
  - Optimized database operations with HikariCP connection pooling
- **Entities** (60+ JPA entities): 
  - Complete domain model with relationships
  - ENUM fields for type safety and data integrity
- **DTOs & Mappers**: 
  - Data transfer objects for API communication
  - MapStruct mappers for entity-DTO conversion
- **Security & Configuration**: 
  - JWT authentication with refresh tokens
  - Role-based access control (RBAC)
  - CORS, security, and performance configurations

#### Key Services
- **CrmLifecycleService**: Automated business rule execution
- **LeadService**: Lead management and conversion workflows
- **DealService**: Deal pipeline and stage management
- **EmailService**: SMTP integration and email automation
- **AsteriskService**: VoIP integration and call management
- **AnalyticsService**: Real-time metrics and reporting
- **WorkflowEngineService**: Business process automation

### Frontend Architecture (React + TypeScript)

#### Module-Based Structure
- **Feature Modules**: 
  - `leads/`, `deals/`, `accounts/`, `contacts/`, `tasks/`
  - `dashboard/`, `communication/`, `documents/`, `reports/`
  - `service/`, `marketing/`, `workflows/`, `settings/`
- **Shared Components**: 
  - Reusable UI components with consistent design system
  - Form components with validation
  - Data visualization components
- **API Layer** (25+ API modules): 
  - Axios-based HTTP client with interceptors
  - Type-safe API calls with TypeScript
  - Error handling and retry logic
- **State Management**: 
  - Redux Toolkit for global state
  - React Query for server state and caching
  - Local state with React hooks
- **Routing & Navigation**: 
  - React Router with protected routes
  - Role-based route access control

### Build & Deployment Process

#### Integrated Build Pipeline
1. **Frontend Build** (Vite):
   ```bash
   cd crm-react
   npm install
   npm run build  # Creates optimized dist/ folder
   ```

2. **Maven Integration**:
   ```xml
   <!-- Frontend Maven Plugin -->
   <plugin>
     <groupId>com.github.eirslett</groupId>
     <artifactId>frontend-maven-plugin</artifactId>
     <!-- Automatically installs Node.js and builds React app -->
   </plugin>
   ```

3. **Resource Copy**:
   ```xml
   <!-- Copies React build to Spring Boot static resources -->
   <plugin>
     <groupId>org.apache.maven.plugins</groupId>
     <artifactId>maven-resources-plugin</artifactId>
   </plugin>
   ```

4. **Single JAR Output**: 
   - Spring Boot packages everything into executable JAR
   - Contains both frontend and backend
   - Ready for deployment

### API Documentation

#### Authentication Endpoints
- `POST /api/auth/login` - User authentication with JWT
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request

#### Core Business Endpoints
- **Leads**: `GET|POST|PUT|DELETE /api/leads`
- **Lead Conversion**: `POST /api/leads/{id}/convert`
- **Deals**: `GET|POST|PUT|DELETE /api/deals`
- **Accounts**: `GET|POST|PUT|DELETE /api/accounts`
- **Contacts**: `GET|POST|PUT|DELETE /api/contacts`
- **Tasks**: `GET|POST|PUT|DELETE /api/tasks`

#### Analytics & Reporting
- `GET /api/dashboard/metrics` - Dashboard statistics
- `GET /api/analytics/sales-performance` - Sales analytics
- `GET /api/reports/pipeline` - Pipeline reports
- `GET /api/reports/revenue` - Revenue reports

#### Communication
- `POST /api/email/send` - Send email
- `GET /api/email/templates` - Email templates
- `POST /api/calls/initiate` - Initiate call
- `GET /api/calls/history` - Call history

#### Administration
- `GET|POST|PUT|DELETE /api/users` - User management
- `GET /api/health` - System health check
- `GET /api/health/database` - Database connectivity
- `GET /api/health/memory` - Memory usage statistics

### Performance Optimizations

#### Backend Optimizations
- **Database**: HikariCP connection pooling, query optimization
- **JVM**: G1GC with optimized heap settings
- **Caching**: Strategic caching for frequently accessed data
- **Logging**: Structured logging with file rotation

#### Frontend Optimizations
- **Code Splitting**: Lazy loading of modules
- **Bundle Optimization**: Vite's optimized build process
- **State Management**: Efficient Redux patterns
- **API Caching**: React Query for intelligent data caching

## 🔒 Security Features

### Authentication & Authorization
- **JWT Authentication**: 
  - Secure token-based authentication with JJWT library
  - Access tokens with configurable expiration (24 hours default)
  - Refresh token mechanism for seamless user experience
  - Token blacklisting for secure logout
- **Role-Based Access Control (RBAC)**: 
  - Granular permission system with 4 distinct roles
  - Method-level security annotations
  - Resource-based access control
  - Dynamic permission evaluation

### Data Security
- **Input Validation**: 
  - Server-side validation for all API inputs
  - Spring Boot Validation with custom validators
  - XSS prevention through input sanitization
  - File upload validation and type checking
- **SQL Injection Protection**: 
  - JPA/Hibernate parameterized queries
  - No dynamic SQL construction
  - Repository pattern with type-safe queries
- **Password Security**: 
  - BCrypt password hashing with salt
  - Password strength requirements
  - Secure password reset workflow with OTP
  - Password history tracking

### Network Security
- **CORS Configuration**: 
  - Secure cross-origin request handling
  - Configurable allowed origins and methods
  - Credential support for authenticated requests
- **HTTPS Support**: 
  - SSL/TLS configuration ready
  - Secure cookie settings
  - HSTS header support

### Application Security
- **ENUM Validation**: 
  - Type-safe ENUM handling for data integrity
  - Database-level ENUM constraints
  - Validation at API and service layers
- **Audit Logging**: 
  - Comprehensive activity logging
  - Security event tracking
  - User action audit trails
- **Session Management**: 
  - Secure session handling
  - Session timeout configuration
  - Concurrent session control

### Infrastructure Security
- **Database Security**: 
  - Connection encryption
  - Database user with minimal privileges
  - Connection pooling with security settings
- **File Security**: 
  - Secure file upload handling
  - File type validation
  - Virus scanning integration ready
- **Error Handling**: 
  - Secure error messages (no sensitive data exposure)
  - Global exception handling
  - Logging of security events

## 📊 Database Schema & Architecture

### Core Entity Relationships

#### Primary Entities
- **Users** (Authentication & Role Management)
  - → **Leads** (one-to-many assignment)
  - → **Tasks** (one-to-many assignment)
  - → **Deals** (one-to-many ownership)
  - → **Activities** (one-to-many tracking)

- **Leads** (Lead Management)
  - → **Accounts** (conversion relationship)
  - → **Activities** (one-to-many tracking)
  - → **Tasks** (one-to-many follow-ups)
  - → **Documents** (one-to-many attachments)

- **Accounts** (Company Management)
  - → **Contacts** (one-to-many relationships)
  - → **Deals** (one-to-many opportunities)
  - → **Activities** (one-to-many interactions)
  - → **Documents** (one-to-many files)

- **Deals** (Opportunity Management)
  - → **DealStageTransition** (one-to-many history)
  - → **DealDocuments** (one-to-many attachments)
  - → **Activities** (one-to-many interactions)
  - → **Tasks** (one-to-many follow-ups)

#### Extended Entities
- **Communication**: Email, Call, CallLog, CallRecording
- **Document Management**: Document, DocumentVersion, DocumentSharing, FolderStructure
- **Service Management**: Case, CaseComment, SLA, CustomerSatisfaction
- **Marketing**: CampaignLead, EmailTemplate
- **Workflow**: WorkflowRule, WorkflowAction, WorkflowExecutionLog
- **Analytics**: Timeline, Notification, DashboardMetric

### ENUM Field Definitions

#### Account & Contact Types
```sql
ENUM('lead', 'prospect', 'customer', 'partner', 'vendor')
```
- **lead**: Initial contact or inquiry
- **prospect**: Qualified potential customer
- **customer**: Active paying customer
- **partner**: Business partnership relationship
- **vendor**: Supplier or service provider

#### Account & Contact Status
```sql
ENUM('active', 'inactive', 'archived')
```
- **active**: Currently engaged relationship
- **inactive**: Temporarily disengaged
- **archived**: Historical record, no longer relevant

#### Deal Stages
```sql
ENUM('Qualification', 'Proposal', 'Negotiation', 'Closed_Won', 'Closed_Lost')
```
- **Qualification**: Initial opportunity assessment
- **Proposal**: Formal proposal submitted
- **Negotiation**: Terms and pricing discussion
- **Closed_Won**: Successfully closed deal
- **Closed_Lost**: Opportunity lost to competitor or cancelled

#### User Roles
```sql
ENUM('IT_ADMIN', 'SALES_VP', 'SALES_MANAGER', 'SALES_EXECUTIVE')
```

### CRM Lifecycle Automation Rules

#### Automated Type Progression
1. **Lead Creation** → Account type = `'lead'`, status = `'active'`
2. **Lead Conversion** → Account type = `'prospect'`, status = `'active'`
3. **Deal Closure (Closed_Won)** → Account/Contact type = `'customer'`
4. **Partnership Agreement** → Type = `'partner'` (manual)
5. **Vendor Relationship** → Type = `'vendor'` (manual)

#### Status Management
1. **New Relationship** → Status = `'active'`
2. **Relationship Pause** → Status = `'inactive'` (manual)
3. **End of Relationship** → Status = `'archived'` (manual)
4. **Reactivation** → Status = `'active'` (manual)

#### Business Rules Engine
- **CrmLifecycleService**: Automated rule execution
- **WorkflowEngineService**: Custom workflow automation
- **Trigger-based Actions**: Database triggers for immediate updates
- **Scheduled Jobs**: Periodic data cleanup and maintenance

### Database Optimization

#### Indexing Strategy
- Primary keys and foreign keys automatically indexed
- Composite indexes on frequently queried combinations
- Full-text search indexes on text fields
- Performance monitoring and query optimization

#### Connection Management
- **HikariCP Connection Pool**: 
  - Development: 3-10 connections
  - Production: 10-50 connections
  - Connection timeout and leak detection
- **Transaction Management**: 
  - Spring @Transactional annotations
  - Optimistic locking for concurrent updates
  - Batch processing for bulk operations

#### Data Integrity
- **Foreign Key Constraints**: Referential integrity
- **Check Constraints**: ENUM validation at database level
- **Unique Constraints**: Prevent duplicate records
- **NOT NULL Constraints**: Required field validation

## 🚀 Deployment Guide

### Production Deployment Checklist

#### 1. Environment Preparation
- **Server Requirements**: 
  - Linux/Windows Server with Java 17+
  - Minimum 8GB RAM, 16GB recommended
  - 50GB+ storage for application and logs
  - MySQL 8.0+ database server

#### 2. Database Setup
```sql
-- Create production database
CREATE DATABASE crm_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'crm_prod_user'@'%' IDENTIFIED BY 'secure_production_password';
GRANT ALL PRIVILEGES ON crm_prod.* TO 'crm_prod_user'@'%';
FLUSH PRIVILEGES;

-- Ensure ENUM fields are properly configured
ALTER TABLE accounts ADD COLUMN type ENUM('lead', 'prospect', 'customer', 'partner', 'vendor') DEFAULT 'lead';
ALTER TABLE accounts ADD COLUMN status ENUM('active', 'inactive', 'archived') DEFAULT 'active';
ALTER TABLE contacts ADD COLUMN type ENUM('lead', 'prospect', 'customer', 'partner', 'vendor') DEFAULT 'lead';
ALTER TABLE contacts ADD COLUMN status ENUM('active', 'inactive', 'archived') DEFAULT 'active';
```

#### 3. Application Configuration
Update `application-PROD.properties`:
```properties
# Production Database
spring.datasource.url=jdbc:mysql://prod-db-server:3306/crm_prod?useSSL=true&requireSSL=true
spring.datasource.username=crm_prod_user
spring.datasource.password=${DB_PASSWORD}

# Production JPA Settings
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

# Production Security
jwt.secret=${JWT_SECRET}
server.ssl.enabled=true
server.ssl.key-store=${SSL_KEYSTORE_PATH}
server.ssl.key-store-password=${SSL_KEYSTORE_PASSWORD}

# Production Email
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}

# Production Performance Settings
server.tomcat.threads.max=200
server.tomcat.max-connections=8192
spring.datasource.hikari.maximum-pool-size=50
spring.datasource.hikari.minimum-idle=10
```

#### 4. Build & Deploy
```bash
# Build production-ready JAR
cd crm-customer-service
mvnw.cmd clean package -DskipTests -Pprod

# Deploy to server
scp target/crm-customer-service-0.0.1-SNAPSHOT.jar user@prod-server:/opt/crm/

# Start with production profile
java -Xms4g -Xmx8g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -Dspring.profiles.active=PROD \
  -jar /opt/crm/crm-customer-service-0.0.1-SNAPSHOT.jar
```

#### 5. Reverse Proxy Configuration (Nginx)
```nginx
server {
    listen 443 ssl http2;
    server_name crm.company.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Environment Variables (Production)
```bash
# Database Configuration
export DB_PASSWORD="secure_production_password"
export SPRING_DATASOURCE_URL="jdbc:mysql://prod-db:3306/crm_prod"

# Security Configuration
export JWT_SECRET="your-256-bit-production-secret-key-here"
export SSL_KEYSTORE_PATH="/opt/crm/ssl/keystore.p12"
export SSL_KEYSTORE_PASSWORD="keystore_password"

# Email Configuration
export MAIL_USERNAME="noreply@company.com"
export MAIL_PASSWORD="production_email_password"

# Asterisk Configuration
export ASTERISK_HOST="prod-asterisk-server"
export ASTERISK_USERNAME="prod_asterisk_user"
export ASTERISK_PASSWORD="prod_asterisk_password"
```

### Monitoring & Maintenance

#### Health Monitoring
- **Application Health**: `/api/health`
- **Database Health**: `/api/health/database`
- **Memory Monitoring**: `/api/health/memory`
- **Custom Metrics**: Available through management endpoints

#### Logging Configuration
```properties
# Production Logging
logging.level.root=WARN
logging.level.com.techtammina.crm=INFO
logging.file.path=/opt/crm/logs
logging.file.name=/opt/crm/logs/crm-application.log
logging.logback.rollingpolicy.max-file-size=100MB
logging.logback.rollingpolicy.max-history=30
logging.logback.rollingpolicy.total-size-cap=5GB
```

#### Backup Strategy
```bash
# Database Backup (Daily)
#!/bin/bash
mysqldump -h prod-db-server -u backup_user -p crm_prod > /backup/crm_prod_$(date +%Y%m%d).sql

# Application Logs Backup (Weekly)
tar -czf /backup/logs_$(date +%Y%m%d).tar.gz /opt/crm/logs/

# Document Files Backup (Daily)
rsync -av /opt/crm/uploads/ /backup/documents/
```

### Performance Optimization

#### JVM Tuning (Production)
```bash
java -Xms4g -Xmx8g \
  -XX:MetaspaceSize=512m \
  -XX:MaxMetaspaceSize=1g \
  -XX:+UseG1GC \
  -XX:G1HeapRegionSize=16m \
  -XX:+UseStringDeduplication \
  -XX:+OptimizeStringConcat \
  -XX:MaxGCPauseMillis=200 \
  -XX:+UnlockExperimentalVMOptions \
  -XX:+UseJVMCICompiler \
  -Dspring.profiles.active=PROD \
  -jar crm-customer-service-0.0.1-SNAPSHOT.jar
```

#### Database Optimization
- **Connection Pooling**: HikariCP with 50 max connections
- **Query Optimization**: Proper indexing and query analysis
- **Regular Maintenance**: ANALYZE TABLE and OPTIMIZE TABLE
- **Monitoring**: Slow query log and performance schema

### Security Hardening

#### Application Security
- **HTTPS Only**: Force SSL/TLS encryption
- **Security Headers**: HSTS, CSP, X-Frame-Options
- **Rate Limiting**: API rate limiting and DDoS protection
- **Input Validation**: Comprehensive input sanitization

#### Infrastructure Security
- **Firewall Rules**: Restrict access to necessary ports only
- **Database Security**: Encrypted connections and minimal privileges
- **Regular Updates**: Keep OS and dependencies updated
- **Audit Logging**: Comprehensive security event logging

## 🔧 Development Guidelines

### Code Standards
- **Java**: Follow Oracle Java coding conventions
- **TypeScript/React**: ESLint and Prettier configurations enforced
- **Database**: Consistent naming conventions and proper indexing
- **API Design**: RESTful principles with consistent response formats
- **Testing**: Minimum 80% code coverage for critical business logic

### Development Workflow
1. **Feature Development**: Create feature branch from `develop`
2. **Code Review**: All changes require peer review
3. **Testing**: Unit tests and integration tests required
4. **Documentation**: Update relevant documentation
5. **Deployment**: Automated CI/CD pipeline

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/lead-management-enhancement

# Make changes and commit
git add .
git commit -m "feat: add lead scoring functionality"

# Push and create pull request
git push origin feature/lead-management-enhancement
```

### Testing Strategy
- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Critical user workflows
- **Performance Tests**: Load testing for scalability

## 📋 Project Status

### Current Version: 1.0.0-SNAPSHOT
- ✅ **Core Features**: Complete (Lead, Deal, Account, Contact management)
- ✅ **Authentication**: JWT-based security implemented
- ✅ **Communication**: Email and VoIP integration complete
- ✅ **Analytics**: Dashboard and reporting functional
- ✅ **Document Management**: File upload and organization ready
- 🔄 **Advanced Workflows**: In development
- 🔄 **Mobile App**: Planned for Phase 2
- 🔄 **Advanced Analytics**: AI/ML features planned

### Roadmap
- **Phase 1** (Current): Core CRM functionality
- **Phase 2** (Q2 2025): Advanced analytics and mobile app
- **Phase 3** (Q3 2025): AI-powered insights and automation
- **Phase 4** (Q4 2025): Enterprise integrations and scalability

## 🤝 Contributing

### How to Contribute
1. **Fork the Repository**: Create your own fork
2. **Set Up Development Environment**: Follow setup instructions
3. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
4. **Implement Changes**: Follow coding standards
5. **Write Tests**: Ensure adequate test coverage
6. **Update Documentation**: Keep docs current
7. **Submit Pull Request**: Detailed description required

### Contribution Guidelines
- **Bug Reports**: Use issue templates with detailed reproduction steps
- **Feature Requests**: Provide business justification and use cases
- **Code Contributions**: Follow established patterns and conventions
- **Documentation**: Clear, concise, and up-to-date

## 📝 License & Legal

### Proprietary Software
Copyright © 2025 Tech Tammina. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.

### Third-Party Licenses
- **Spring Boot**: Apache License 2.0
- **React**: MIT License
- **MySQL**: GPL License (Commercial license available)
- **Other Dependencies**: See respective license files

## 📞 Support & Contact

### Technical Support
- **Email**: support@techtammina.com
- **Phone**: +91 98765 43210
- **Hours**: Monday-Friday, 9:00 AM - 6:00 PM IST
- **Emergency**: 24/7 support for critical issues

### Business Inquiries
- **Sales**: sales@techtammina.com
- **Partnerships**: partnerships@techtammina.com
- **General**: hello@techtammina.com

### Office Address
**Tech Tammina Pvt. Ltd.**  
SVS Towers, 3rd Floor  
Visakhapatnam, Andhra Pradesh - 530016  
India

### Online Presence
- **Website**: https://www.techtammina.com
- **LinkedIn**: https://linkedin.com/company/techtammina
- **Documentation**: Internal wiki and knowledge base

---

**Tech Tammina CRM** - *Delivering Excellence in Sales Management*

*Built with ❤️ by the Tech Tammina Development Team*