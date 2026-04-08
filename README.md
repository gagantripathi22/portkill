# portkill

> Simple CLI tool to find and kill processes running on specific ports. Works on Linux, macOS, and Windows.

## Why?

Ever tried to start your dev server and got hit with `EADDRINUSE`? Yeah, me too. This is a tiny tool that makes it easy to find what's using a port and kill it.

## Install

```bash
# With npm (global install)
npm install -g @gagantripathi22/portkill

# Or use it without installing (npx)
npx @gagantripathi22/portkill kill 3000
```

**Requirements:**
- Node.js 14 or higher
- Linux: `ss` or `netstat`
- macOS: `lsof`
- Windows: `netstat` and `wmic`

Most systems already have these installed.

## Usage

```bash
# Kill whatever's running on port 8080
portkill kill 8080

# Kill on multiple ports at once
portkill kill 3000,3001,8080

# Find processes by name (uses regex)
portkill find node

# List all processes listening on ports
portkill list

# List processes on specific ports
portkill list 3000,8080

# Skip the "are you sure?" prompt
portkill kill 8080 --yes

# Force kill (SIGKILL on Unix, /F on Windows)
portkill kill 8080 --force

# See more details about processes
portkill list --verbose

# Get JSON output (great for scripting)
portkill list --json
```

## Options

| Flag | Description |
|------|-------------|
| `-f, --force` | Force kill (SIGKILL / /F) |
| `-y, --yes` | Skip confirmation prompt |
| `-v, --verbose` | Show full process info (PID, USER, CMD) |
| `--json` | Output as JSON |

## Examples

```bash
# Quick kill
portkill kill 3000 --yes

# See what's running before killing
portkill list 8080 --verbose

# Kill a stuck process
portkill kill 3000 --force

# Find all node processes
portkill find node
```

## How It Works

- **Linux**: Uses `ss` (modern) or `netstat` (fallback) to find processes
- **macOS**: Uses `lsof` to find processes
- **Windows**: Uses `netstat` + `wmic` to get process details

## License

MIT
