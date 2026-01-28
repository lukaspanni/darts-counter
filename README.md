# Darts Scorer

A simple, modern darts scoring application built with Next.js and React. Track your dart games, view statistics, and improve your skills with this intuitive scoring app. Now with **live streaming** support!

## Features

- **Multiple Game Modes**: Support for standard 501, 301, and custom starting scores
- **Out Modes**: Choose between single or double out rules
- **Multi-Player Support**: Play with multiple players
- **Best-of-X Rounds**: Configure how many rounds to win
- **Score Tracking**: Keep track of all throws and scores
- **Statistics**: View player averages and performance metrics
- **Game History**: Review past games and statistics
- **Checkout Assist**: Optional assistance for checkout calculations
- **Dark/Light Theme**: Toggle between dark and light modes
- **Enhanced View**: Optional enhanced dartboard visualization
- **🎯 Live Streaming**: Share games in real-time with unlimited viewers

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Radix UI
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Package Manager**: pnpm
- **Live Streaming**: Cloudflare Durable Objects + WebSockets

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lukaspanni/darts-counter.git
   cd darts-counter
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. (Optional) Set up live streaming:
   ```bash
   cp .env.example .env
   # Edit .env and configure NEXT_PUBLIC_LIVE_STREAM_WORKER_URL
   ```

4. Run the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. (Optional) Start the live stream worker:
   ```bash
   cd workers/darts-live-stream
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
pnpm build
pnpm start
```

## Available Scripts

- `pnpm dev` - Start the development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Run TypeScript type checking

## How to Play

1. **Setup**: Configure your game settings (starting score, out mode, rounds to win)
2. **Add Players**: Enter player names
3. **Start Game**: Begin playing and enter scores after each throw
4. **Track Progress**: View real-time scores, averages, and round information
5. **Game Over**: Review statistics and start a new game

## Live Streaming

Share your games in real-time with viewers around the world!

### Quick Start

1. Start a game as usual
2. On the pre-game screen, click "Start Stream"
3. Copy and share the generated URL
4. Viewers can watch live at that URL
5. All score updates are broadcast automatically

For detailed setup and usage instructions, see [LIVE_STREAM.md](./LIVE_STREAM.md).

## Project Structure

```
darts-counter/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Utilities and business logic
│   └── types/           # TypeScript type definitions
├── workers/
│   └── darts-live-stream/  # Cloudflare Worker for live streaming
├── public/              # Static assets
└── ...config files
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Lukas Panni - [GitHub](https://github.com/lukaspanni)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Deployed on [Vercel](https://vercel.com/)
- Live streaming powered by [Cloudflare Workers](https://workers.cloudflare.com/)
