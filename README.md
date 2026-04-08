# portkill

> A cross-platform CLI tool to find and kill processes by port number.

![Platform](https://img.shields.io/badge/platform-linux%20%7C%20macos%20%7C%20windows-blue)
![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8)

---

## Why portkill?

Every developer hits "port already in use" at some point. portkill makes it trivial to:

- Find what's running on a port
- Kill it with a single command
- Or use interactive mode to browse and select

Works on **Linux**, **macOS**, and **Windows** out of the box.

---

## Install

### One-liner (Linux/macOS)

```bash
curl -sL https://raw.githubusercontent.com/gagantripathi22/portkill/main/install.sh | bash
```

### One-liner (Windows)

```powershell
irm https://raw.githubusercontent.com/gagantripathi22/portkill/main/install.ps1 | iex
```

### Go install

```bash
go install github.com/gagantripathi22/portkill@latest
```

### Download binary

Grab a pre-built release from the [Releases](https://github.com/gagantripathi22/portkill/releases) page.

---

## Usage

### Interactive mode

```bash
portkill list -i
```

Navigate with arrow keys, press Enter to select a port, then choose an action.

```
  portkill — Interactive Mode
  =============================

  ↑↓ Navigate  |  [Enter] Select  |  [Esc] Quit

   #  | PID     | PORT | NAME
  -----|---------|------|------------------
  → 1  | 12345 | 3000 | node
    2  | 67890 | 8080 | npm
    3  | 11111 | 5000 | python
```

### Kill by port

```bash
portkill kill 3000
```

### Force kill

```bash
portkill kill 3000 --force
```

### Kill multiple ports

```bash
portkill kill-all 3000 8080 5000
```

### List all ports

```bash
portkill list
```

### Find processes by name

```bash
portkill find node
```

### Skip confirmation

```bash
portkill kill 3000 --yes
```

### JSON output (for scripts)

```bash
portkill list --json
```

---

## Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--force` | `-f` | Force kill (SIGKILL on Unix, /F on Windows) |
| `--yes` | `-y` | Skip confirmation prompt |
| `--verbose` | `-v` | Show detailed output |
| `--json` | | Output as JSON |
| `--interactive` | `-i` | Interactive mode with arrow navigation |

---

## Commands

| Command | Description |
|---------|-------------|
| `portkill kill <port>` | Kill process on specific port |
| `portkill kill-all <port>...` | Kill processes on multiple ports |
| `portkill list [port...]` | List processes using ports |
| `portkill find <name>` | Find processes by name |
| `portkill version` | Show version |

---

## License

MIT © gagantripathi22
