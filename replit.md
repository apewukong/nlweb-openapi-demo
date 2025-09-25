# Overview

This is a **NLWeb AI Agent Demo Application** that combines a React frontend with Python/Flask backend services for processing natural language queries against Schema.org structured data. The application serves as a demonstration platform for an AI agent that can parse, index, and search Schema.org markup from websites using OpenAI's language models and vector search capabilities.

The system allows users to ask natural language questions about structured data found on websites, with the AI agent processing these queries through vector similarity search and OpenAI's GPT models to provide relevant, contextual responses.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Organized into reusable UI components, pages, and feature-specific panels

## Backend Architecture
- **Primary Server**: Express.js/TypeScript server for API routing and middleware
- **AI Processing Service**: Python Flask application handling NLWeb AI operations
- **Data Processing**: Modular Python services for Schema.org parsing, vector storage, and OpenAI integration
- **API Design**: RESTful endpoints following NLWeb specification with `/ask` endpoint for natural language queries

## Data Storage and Processing
- **Database**: PostgreSQL with Drizzle ORM for schema management and migrations
- **Vector Storage**: In-memory vector store using scikit-learn for similarity search
- **Embedding Generation**: OpenAI's text-embedding-ada-002 model for document vectorization
- **Schema Parsing**: Multi-format support for JSON-LD, Microdata, and RDFa extraction

## AI and Machine Learning
- **Language Model**: OpenAI GPT-4 for natural language processing and response generation
- **Embedding Strategy**: Document chunking and vector similarity search for context retrieval
- **Query Processing**: Two-stage approach combining vector search with LLM reasoning
- **Response Format**: Schema.org-compliant structured responses with metadata

## Configuration Management
- **Environment-based**: Dotenv configuration with separate settings for development/production
- **Modular Config**: Separate configuration classes for OpenAI, NLWeb, and error handling
- **Runtime Validation**: Zod schemas for type-safe configuration validation

# External Dependencies

## AI and Machine Learning Services
- **OpenAI API**: GPT-4 for language processing and text-embedding-ada-002 for vector embeddings
- **Scikit-learn**: Vector similarity calculations and machine learning utilities

## Database and Data Management
- **PostgreSQL**: Primary database (configured via Drizzle but can be provisioned)
- **Neon Database**: Serverless PostgreSQL provider for hosted database instances

## Web Services and APIs
- **Schema.org**: Structured data vocabulary standards and validation
- **Web Scraping**: BeautifulSoup4 and requests for HTML parsing and data extraction

## Development and Deployment
- **Replit Platform**: Development environment with specialized Vite plugins
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Type Safety**: TypeScript across the full stack with shared schema definitions

## UI and Design
- **Radix UI**: Headless component primitives for accessibility and functionality
- **Tailwind CSS**: Utility-first styling with custom design system
- **Font Resources**: Google Fonts integration for typography (Inter, Fira Code, etc.)

## Session and State Management
- **TanStack React Query**: Client-side caching and synchronization
- **Connect-pg-simple**: PostgreSQL session storage for user sessions