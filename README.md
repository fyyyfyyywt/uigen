# UIGen

AI-powered React component generator with live preview.

## Prerequisites

- Node.js 18+
- npm

## Setup

1. **Optional** Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

The project will run without an API key. Rather than using a LLM to generate components, static code will be returned instead.

2. Install dependencies and initialize database

```bash
npm run setup
```

This command will:

- Install all dependencies
- Generate Prisma client
- Run database migrations

## Running Locally

### Development

```bash
npm run dev
```

Open [http://localhost:3000/uigen](http://localhost:3000/uigen) (Note: `/uigen` path is required)

## Deployment (Self-Hosted)

### Prerequisites
- Docker & Docker Compose
- A VPS (e.g., DigitalOcean, Hetzner, etc.)
- (Optional) A domain name

### 1. Build & Run
The project includes a `Dockerfile` and `docker-compose.yml` for easy deployment.

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/uigen.git
cd uigen

# 2. Configure Environment
cp .env.example .env
nano .env # Add your Google/Anthropic API Keys

# 3. Start
docker compose up -d --build
```
The app will start on port **3000** (Internal).

### 2. Reverse Proxy Setup (e.g., Hostinger / Apache)
If you are hosting this on a VPS but want to access it via a sub-path of your main domain (e.g., `example.com/uigen`) that is hosted elsewhere:

**VPS Side**:
The `docker-compose.yml` uses Traefik labels for routing. Ensure you have a Traefik instance running on the `default` network (or update the network config).

**Webhost Side (.htaccess)**:
Add this to the **TOP** of your `.htaccess` file (before WordPress rules):
```apache
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy /uigen to VPS
RewriteRule ^uigen(.*)$ http://<YOUR_VPS_IP>:3000/uigen$1 [P,L]
</IfModule>
```

## Usage

1. Sign up or continue as anonymous user
2. Describe the React component you want to create in the chat
3. View generated components in real-time preview
4. Switch to Code view to see and edit the generated files
5. Continue iterating with the AI to refine your components

## Features

- AI-powered component generation using Claude
- Live preview with hot reload
- Virtual file system (no files written to disk)
- Syntax highlighting and code editor
- Component persistence for registered users
- Export generated code

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma with SQLite
- Anthropic Claude AI
- Vercel AI SDK
