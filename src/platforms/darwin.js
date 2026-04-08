const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class DarwinFinder {
  async findByPort(port) {
    const { stdout } = await execPromise(`lsof -i -P -n -sTCP:LISTEN`);
    const processes = [];
    const lines = stdout.split('\n');
    const portStr = String(port);

    for (const line of lines) {
      if (line.startsWith('COMMAND')) continue;
      if (line.includes(':' + portStr) && line.includes('(LISTEN)')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 9) {
          const pid = parseInt(parts[1], 10);
          if (!isNaN(pid)) {
            processes.push({
              pid,
              name: parts[0],
              port,
              user: parts[2],
              cmd: parts.slice(8).join(' ')
            });
          }
        }
      }
    }
    return processes;
  }

  async findByPattern(pattern) {
    const { stdout } = await execPromise(`lsof -i -P -n`);
    const processes = [];
    const lines = stdout.split('\n');
    const re = new RegExp(pattern, 'i');
    const seen = new Set();

    for (const line of lines) {
      if (line.startsWith('COMMAND')) continue;
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const name = parts[0];
        const pid = parseInt(parts[1], 10);
        if (re.test(name) && !seen.has(pid)) {
          seen.add(pid);
          processes.push({
            pid,
            name,
            user: parts[2]
          });
        }
      }
    }
    return processes;
  }

  async listAll() {
    const { stdout } = await execPromise(`lsof -i -P -n -sTCP:LISTEN`);
    const processes = [];
    const lines = stdout.split('\n');
    const seen = new Set();

    for (const line of lines) {
      if (line.startsWith('COMMAND')) continue;
      const parts = line.split(/\s+/);
      if (parts.length >= 9) {
        const pid = parseInt(parts[1], 10);
        if (seen.has(pid)) continue;
        seen.add(pid);

        const addr = parts[8];
        const portMatch = addr.match(/:(\d+)$/);
        const port = portMatch ? parseInt(portMatch[1], 10) : 0;

        processes.push({
          pid,
          name: parts[0],
          port,
          user: parts[2],
          cmd: parts.slice(8).join(' ')
        });
      }
    }
    return processes;
  }
}

class DarwinKiller {
  kill(pid, force) {
    const sig = force ? 'SIGKILL' : 'SIGTERM';
    return execPromise(`kill -${sig === 'SIGKILL' ? '9' : '15'} ${pid}`);
  }

  async killAll(pids, force) {
    for (const pid of pids) {
      await this.kill(pid, force);
    }
  }
}

module.exports = { DarwinFinder, DarwinKiller };
