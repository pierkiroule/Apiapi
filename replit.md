# Overview

CourtialAPI is a text analysis and lexical network visualization application that processes text documents to generate word frequency analysis, network graphs, and community detection. The application allows users to upload text files, configure analysis parameters, and visualize the results through interactive dashboards with network graphs and statistical insights.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI primitives with shadcn/ui components for consistent design system
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Text Processing**: Natural language processing using the `natural` library for tokenization, stemming, and stopword removal
- **Development**: Hot module replacement via Vite integration for development workflow

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless connection for cloud PostgreSQL
- **Fallback Storage**: In-memory storage implementation for development/testing

## Database Schema Design
- **Users Table**: Basic user management with username/password authentication
- **Analyses Table**: Comprehensive analysis storage including:
  - Original and processed text content
  - Analysis configuration options (stopwords, lemmatization, etc.)
  - Computed results (word frequencies, network data, communities)
  - Processing status tracking (pending, processing, completed, failed)
  - Timestamps for audit trail

## Text Analysis Pipeline
- **Tokenization**: Word-level tokenization with configurable preprocessing
- **Linguistic Processing**: Optional stopword removal, accent removal, and lemmatization
- **Frequency Analysis**: Word frequency calculation with relative percentages
- **Network Generation**: Word co-occurrence network construction
- **Community Detection**: Graph clustering for semantic grouping
- **Visualization Data**: Pre-computed positions and styling for network visualization

## API Architecture
- **Analysis Management**: CRUD operations for text analysis jobs
- **File Processing**: Text upload and processing workflow
- **Export Functionality**: Multiple format exports (JSON, CSV, etc.)
- **Status Tracking**: Real-time analysis progress monitoring
- **Error Handling**: Comprehensive error responses with proper HTTP status codes

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **PostgreSQL**: Primary relational database for persistent storage

## Development Tools
- **Vite**: Modern build tool with hot module replacement and optimized bundling
- **Drizzle Kit**: Database schema management and migration tools
- **TypeScript**: Type checking and enhanced developer experience

## UI and Visualization
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Tailwind CSS**: Utility-first CSS framework with design system integration
- **Lucide React**: Consistent icon library for UI elements

## Text Processing Libraries
- **Natural**: Natural language processing toolkit for tokenization and stemming
- **Date-fns**: Date manipulation and formatting utilities

## Development Environment
- **Replit Integration**: Runtime error overlay and development banner for Replit environment
- **ESBuild**: Fast JavaScript bundler for production builds