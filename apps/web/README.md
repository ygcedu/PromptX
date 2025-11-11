# PromptX Web

React frontend for PromptX management and monitoring.

## Features

- 🎭 **Role Management**: Browse and manage AI roles (system and user-created)
- 🔧 **Tool Discovery**: Explore available tools and their documentation
- 📊 **System Monitoring**: Real-time status monitoring of PromptX MCP Server
- 🚀 **Modern UI**: Responsive design with React + Vite

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **JavaScript** - No TypeScript for simplicity
- **CSS3** - Custom styling with modern features

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
pnpm lint:fix
```

## Project Structure

```
src/
├── components/          # Reusable components
│   └── Layout.jsx      # Main layout with navigation
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── Roles.jsx       # Role management
│   ├── Tools.jsx       # Tool discovery
│   └── Status.jsx      # System status
├── App.jsx             # Main app component
├── main.jsx            # Entry point
├── App.css             # App-specific styles
└── index.css           # Global styles
```

## API Integration

The app is designed to integrate with the PromptX MCP Server `/status` endpoint:

```javascript
// Example API call
const response = await fetch('http://localhost:5203/status');
const data = await response.json();
```

Currently uses mock data for development. Update the fetch calls in each page component to connect to the actual MCP server.

## Deployment

```bash
# Build for production
pnpm build

# The dist/ folder contains the built app
# Deploy to any static hosting service
```

## Configuration

- **Port**: Development server runs on port 3000
- **API Base URL**: Configure in each component or create a config file
- **Build Output**: `dist/` directory

## Contributing

1. Follow the existing code style
2. Use functional components with hooks
3. Keep components simple and focused
4. Add proper error handling

## License

MIT - See the main PromptX repository for details.