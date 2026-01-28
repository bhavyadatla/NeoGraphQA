# NeoGraphQA

## Overview

NeoGraphQA is a multi-modal intelligence platform that transforms documents (PDFs, text, images) into a queryable knowledge base using Graph RAG (Retrieval-Augmented Generation). The application enables users to upload documents, extract knowledge graphs, and query their content through an AI-powered chat interface.

Key capabilities:
- Document upload and processing (PDF, TXT, CSV, images)
- Knowledge graph extraction and visualization
- Multi-modal chat QA with document context
- Image analysis and generation via OpenAI
- Replit Auth for user authentication

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom plugins for Replit integration
- **UI Features**: Force-directed graph visualization (react-force-graph-2d), Framer Motion animations, react-dropzone for file uploads

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: REST endpoints defined in `shared/routes.ts` with Zod validation
- **File Handling**: Multer for multipart uploads, stored in `uploads/` directory
- **PDF Parsing**: pdf-parse library via CommonJS require

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` with models split into `shared/models/`
- **Key Tables**:
  - `users` and `sessions` (Replit Auth)
  - `documents` (uploaded files and extracted text)
  - `kg_nodes` and `kg_edges` (knowledge graph entities and relationships)
  - `conversations` and `messages` (chat history)

### Authentication
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Implementation**: Passport.js with custom OIDC strategy in `server/replit_integrations/auth/`

### AI Integration
- **Provider**: OpenAI API via Replit AI Integrations
- **Features**:
  - Text chat completions for document QA
  - Image generation (gpt-image-1 model)
  - Image analysis for visual content understanding
  - Voice chat with audio transcription and TTS

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route-level page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  replit_integrations/  # Modular AI feature implementations
    auth/         # Replit Auth setup
    chat/         # Conversation storage
    image/        # Image generation
    audio/        # Voice chat (optional)
shared/           # Shared types and schemas
  schema.ts       # Drizzle database schema
  routes.ts       # API route definitions with Zod
  models/         # Domain model schemas
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and queries
- **Migrations**: Run `npm run db:push` to sync schema

### AI Services
- **OpenAI API**: Accessed through Replit AI Integrations proxy
- **Environment Variables**:
  - `AI_INTEGRATIONS_OPENAI_API_KEY`: API key for OpenAI
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`: Replit proxy URL

### Authentication
- **Replit OIDC**: OAuth2/OpenID Connect provider
- **Environment Variables**:
  - `REPL_ID`: Replit environment identifier
  - `ISSUER_URL`: OIDC issuer (defaults to Replit)
  - `SESSION_SECRET`: Session encryption key

### Frontend Libraries
- shadcn/ui components (Radix UI primitives)
- react-force-graph-2d for knowledge graph visualization
- Framer Motion for animations
- react-dropzone for file uploads
- react-markdown for chat rendering