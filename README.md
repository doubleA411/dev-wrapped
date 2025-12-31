# wrap-it 🎁

A CLI tool that generates a beautiful year-end wrapped for developers using Git data from any repository.

## Features

- 📊 **Comprehensive Git Stats**: Total commits, lines added/deleted, streaks, and more
- 📅 **Monthly Breakdown**: Visualize your commit patterns throughout the year
- 💻 **Top Languages**: See which programming languages you used most
- 🖼️ **Beautiful Images**: Generate shareable PNG images of your stats
- ⚡ **Fast & Easy**: Single command to generate your wrapped

## Installation

```bash
npm install -g @doublea0411/wrap-it
```

Or use with npx (no installation required):

```bash
npx wrap-it
```

## Usage

Navigate to any Git repository and run:

```bash
wrap-it
```

Or use the shorter alias:

```bash
wrap
```

The tool will:

1. Analyze your Git history for the current year
2. Display stats in your terminal
3. Generate a beautiful PNG image (`developer-wrapped-2025.png`)

## Requirements

- Node.js 14 or higher
- Git repository with commit history
- For image generation: Cairo graphics library (see below)

### Installing Cairo (for image generation)

**macOS:**

```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

**Ubuntu/Debian:**

```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**Windows:**

- Follow the [node-canvas Windows installation guide](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)

## What You Get

- **Terminal Output**: Colorful stats display with emojis
- **PNG Image**: A professionally designed image perfect for sharing on social media
- Stats include:
  - Total commits
  - Lines added and deleted
  - Longest commit streak
  - Top programming languages
  - Monthly commit breakdown
  - Most active day

## Example Output

```
2025 DEVELOPER WRAPPED

Languages
1  JavaScript
2  SCSS
3  HTML

Commits        Lines Added
413            290.8K

Lines Deleted  Streak
102.0K         12d

+ Monthly bar chart visualization
```

## Development

Clone the repository:

```bash
git clone https://github.com/yourusername/wrap-it.git
cd wrap-it
npm install
npm run build
npm link
```

## License

MIT

## Author

Akash S

---

Made with ❤️ for developers who love Git stats
