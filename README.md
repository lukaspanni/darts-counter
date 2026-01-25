# Darts Scorer

A simple, modern darts scoring application built with Next.js and React. Track your dart games, view statistics, and improve your skills with this intuitive scoring app.

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

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Radix UI
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Package Manager**: pnpm

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

3. Run the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Lukas Panni - [GitHub](https://github.com/lukaspanni)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
