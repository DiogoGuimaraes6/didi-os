# Didi Web - Personal Assistant Task Manager

A complete Next.js PWA for task and project management with calendar view. Built as an MVP with no AI or screenshots - just solid task management functionality.

## Features

### ✅ **Core Functionality**
- **Tasks Management**: Create, edit, complete, and delete tasks
- **Projects Management**: Organize work into projects with status tracking
- **Calendar View**: Visual monthly calendar showing tasks by due date
- **Task-Project Linking**: Assign tasks to projects for better organization
- **PWA Support**: Installable as a progressive web app

### ✅ **Technical Highlights**
- **Dual Database Support**: File-based persistence (dev) + Turso (production)
- **Serverless Ready**: Optimized for Vercel free tier deployment
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Clean, minimal UI that works on all devices
- **Real-time Updates**: Instant UI updates with optimistic rendering

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Data Persistence
- **Development**: Data saved to `.dev-tasks.json` and `.dev-projects.json` files
- **Production**: Uses Turso database when environment variables are configured
- **Automatic**: Data persists across server restarts and page navigation

## Pages Overview

| Page | URL | Description |
|------|-----|-------------|
| **Tasks** | `/` | Main task management interface with create/edit/delete |
| **Projects** | `/projects` | Project management with status tracking |
| **Calendar** | `/calendar` | Monthly calendar view showing tasks by due date |

### Tasks Features
- ✅ Create tasks with title, description, priority
- ✅ Set due dates for calendar integration
- ✅ Assign tasks to projects
- ✅ Mark tasks as complete/incomplete
- ✅ Delete tasks
- ✅ Visual priority indicators

### Projects Features
- ✅ Create projects with descriptions
- ✅ Status tracking: Upcoming, In Progress, Completed, On Hold
- ✅ Color-coded status indicators
- ✅ Link tasks to projects
- ✅ Delete projects

### Calendar Features
- ✅ Monthly grid view
- ✅ Tasks displayed on due dates
- ✅ Color coding: Blue (todo) vs Green (completed)
- ✅ Navigate between months
- ✅ Project names shown on task cards
- ✅ Hover for full task details

## Database Configuration

### Development Mode (File-based)
No configuration needed. Data automatically saved to:
- `.dev-tasks.json` - Task data
- `.dev-projects.json` - Project data

Files are gitignored and persist across server restarts.

### Production Mode (Turso)
1. **Create Turso Database** (free tier available)
   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Create database
   turso db create didi-web
   
   # Get connection details
   turso db show didi-web
   turso db tokens create didi-web
   ```

2. **Set Environment Variables**
   ```bash
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   ```

### Database Schema
Tables are automatically created on first API call:

```sql
-- Tasks table
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  dueDate TEXT,
  projectId INTEGER,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Projects table  
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Upcoming',
  createdAt TEXT DEFAULT (datetime('now'))
);
```

## Deployment

### Vercel (Recommended)
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect GitHub repository
   - Set environment variables:
     - `TURSO_DATABASE_URL`
     - `TURSO_AUTH_TOKEN`
   - Deploy

3. **PWA Configuration**
   - PWA automatically enabled in production
   - Users can install as app from browser
   - Offline support included

### Other Platforms
Compatible with any Node.js hosting:
- **Netlify**: Add build command `npm run build`
- **Railway**: Automatic deployment from GitHub
- **DigitalOcean App Platform**: Node.js app configuration

## API Reference

### Tasks API (`/api/tasks`)
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks?id=<id>` - Update task
- `DELETE /api/tasks?id=<id>` - Delete task

### Projects API (`/api/projects`)
- `GET /api/projects` - List all projects  
- `POST /api/projects` - Create new project
- `PATCH /api/projects?id=<id>` - Update project
- `DELETE /api/projects?id=<id>` - Delete project

### Task Object
```typescript
{
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date
  projectId?: number;
  createdAt: string;
}
```

### Project Object
```typescript
{
  id: number;
  name: string;
  description?: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'On Hold';
  createdAt: string;
}
```

## Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Pure CSS with CSS custom properties
- **Database**: Turso (libsql) for production, file-based for development
- **PWA**: next-pwa for offline support and app installation
- **Deployment**: Optimized for Vercel serverless functions

## Development

### Project Structure
```
├── pages/
│   ├── index.tsx          # Tasks page
│   ├── projects.tsx       # Projects page
│   ├── calendar.tsx       # Calendar page
│   └── api/
│       ├── tasks.ts       # Tasks API
│       └── projects.ts    # Projects API
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── icon-192.png       # PWA icon
│   └── icon-512.png       # PWA icon
├── styles.css             # Global styles
└── next.config.js         # Next.js + PWA config
```

### Adding Features
1. **New Page**: Add to `pages/` directory
2. **New API**: Add to `pages/api/` directory  
3. **Database**: Schema auto-created on first use
4. **Styling**: Add to `styles.css` or component styles

### Debugging
- **Development**: Check `.dev-*.json` files for data
- **Production**: Use Turso CLI to inspect database
- **Logs**: Check Vercel function logs for API issues

## Security Notes

- No authentication implemented (add if needed)
- API endpoints are public (add auth middleware if required)
- CORS not configured (frontend and API same origin)
- Input validation basic (extend for production use)

## Performance

- **Bundle Size**: Optimized for Vercel free tier limits
- **API Response**: <100ms typical response times
- **PWA**: Offline-first with service worker caching
- **Images**: Optimized PWA icons included

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ for productivity and simplicity**