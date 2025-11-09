# FlashLearn MVP

An intelligent web application for creating and learning flashcards using spaced repetition methodology. FlashLearn automates the time-consuming process of flashcard creation by generating them from any text source using AI.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

FlashLearn is a web-based learning platform that revolutionizes the flashcard creation process. While spaced repetition is one of the most effective memorization techniques, many learners abandon it due to the time-consuming nature of creating flashcards manually. FlashLearn solves this problem by:

- **Automating flashcard generation** from any text source (articles, e-books, notes)
- **Reducing creation time** from hours to just a few clicks
- **Enabling learners to focus** on studying rather than content preparation
- **Supporting self-learners** with an intuitive interface and efficient workflow

### Key Features

- 🤖 AI-powered automatic flashcard generation
- 📝 Support for texts between 1,000-10,000 words
- 🎯 Generate up to 20 flashcards per session
- ✅ Accept/reject system for quality control
- 📚 Organize flashcards into named sets
- 🔄 Random-order review sessions
- 👤 User authentication with email/password
- 💾 Store up to 200 sets or 10,000 flashcards per user

## Tech Stack

### Frontend
- **[Astro](https://astro.build/)** v5 - Modern web framework for fast, content-focused websites
- **[React](https://react.dev/)** v19 - UI library for interactive components
- **[TypeScript](https://www.typescriptlang.org/)** v5 - Type-safe JavaScript development
- **[Tailwind CSS](https://tailwindcss.com/)** v4 - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible component library

### Backend
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service platform providing:
  - PostgreSQL database
  - User authentication
  - Real-time subscriptions
  - RESTful APIs

### AI Integration
- **[OpenRouter.ai](https://openrouter.ai/)** - Multi-model AI gateway providing:
  - Access to various LLMs (OpenAI, Anthropic, Google, etc.)
  - Cost optimization
  - API rate limiting

### DevOps
- **CI/CD**: GitHub Actions
- **Hosting**: DigitalOcean (via Docker)
- **Version Control**: Git/GitHub

## Getting Started Locally

### Prerequisites

- Node.js v22.14.0 (specified in `.nvmrc`)
- npm (included with Node.js)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/premierrt/10xCards.git
   ```

2. **Install Node.js version**
   
   If using nvm:
   ```bash
   nvm install
   nvm use
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Configure the following variables:
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # OpenRouter Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Available Scripts

| Script | Description |
|--------|--------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code with Prettier |

## Project Scope

### MVP Features

#### Flashcard Generation & Management
- Text input support (1,000-10,000 words)
- AI-generated Q&A format flashcards
- Automatic content summarization (100-200 characters)
- Accept/reject workflow for quality control
- Named flashcard sets
- Set deletion functionality

#### Learning System
- Random-order flashcard review
- Simple Know/Don't Know tracking
- Session-based repetition for unlearned cards
- Homepage dashboard with all sets

#### User Management
- Email/password authentication
- Secure user sessions
- Personal flashcard library
- Storage limits enforcement

### Out of Scope (MVP)

- Advanced spaced repetition algorithms
- Flashcard sharing between users
- External content integrations (PDF, DOCX)
- Mobile applications
- Bulk operations on flashcards
- Post-acceptance flashcard editing
- Export functionality
- Onboarding tutorials

## Project Status

🚧 **Status**: MVP Development

This project is currently in the Minimum Viable Product (MVP) stage. The focus is on delivering core functionality with a streamlined user experience.

### Success Metrics

- 75% of generated flashcards are accepted during creation
- 75% of all flashcards are AI-generated vs manually created
- Users return to the app at least 3 times per week
- Flashcard generation completes within 10 seconds

### Roadmap

Future enhancements may include:
- Advanced spaced repetition algorithms
- Mobile applications
- Social features and sharing
- Additional content import formats
- Bulk operations and management tools

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for learners who value their time.
