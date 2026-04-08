const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class WindowsFinder {
  async findByPort(port) {
    const { stdout } = await execPromise(`netstat -ano`);
    const processes = [];
    const lines = stdout.split('\n');
    const portStr = ':' + port;

    for (const line of lines) {
      if (!line.includes(portStr) || !line.includes('LISTENING')) continue;

      const parts = line.split(/\s+/).filter(p => p);
      if (parts.length < 5) continue;

      const pid = parseInt(parts[parts.length - 1], 10);
      if (isNaN(pid)) continue;

      const [name, user, cmd] = await this.getProcessDetails(pid);
      processes.push({
        pid,
        name: name || 'unknown',
        port,
        user: user || 'unknown',
        cmd: cmd || ''
      });
    }
    return processes;
  }

  async findByPattern(pattern) {
    const { stdout } = await execPromise(`tasklist /FO LIST /NH`);
    const processes = [];
    const re = new RegExp(pattern, 'i');
    const lines = stdout.split('\n');

    for (const line of lines) {
      const fields = line.trim().split(/\s+/);
      if (fields.length < 2) continue;

      const name = fields[0];
      if (!re.test(name)) continue;

      const pid = parseInt(fields[1], 10);
      if (isNaN(pid)) continue;

      const [, user, cmd] = await this.getProcessDetails(pid);
      processes.push({
        pid,
        name,
        user: user || 'unknown',
        cmd: cmd || ''
      });
    }
    return processes;
  }

  async listAll() {
    const { stdout } = await execPromise(`netstat -ano`);
    const processes = [];
    const lines = stdout.split('\n');
    const seen = new Set();

    for (const line of lines) {
      if (!line.includes('LISTENING')) continue;

      const parts = line.split(/\s+/).filter(p => p);
      if (parts.length < 5) continue;

      const localAddr = parts[1];
      const portMatch = localAddr.match(/:(\d+)$/);
      const port = portMatch ? parseInt(portMatch[1], 10) : 0;

      const pid = parseInt(parts[parts.length - 1], 10);
      if (isNaN(pid) || seen.has(pid)) continue;
      seen.add(pid);

      const [name, user, cmd] = await this.getProcessDetails(pid);
      processes.push({
        pid,
        name: name || 'unknown',
        port,
        user: user || 'unknown',
        cmd: cmd || ''
      });
    }
    return processes;
  }

  async getProcessDetails(pid) {
    try {
      const { stdout } = await execPromise(`wmic process where ProcessId=${pid} get Name,CommandLine /format:list`);
      let name = 'unknown';
      let cmd = '';

      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.startsWith('Name=')) {
          name = line.substring(5).trim();
        } else if (line.startsWith('CommandLine=')) {
          cmd = line.substring(12).trim();
        }
      }

      return [name, '', cmd];
    } catch {
      return ['unknown', 'unknown', ''];
    }
  }
}

class WindowsKiller {
  kill(pid, force) {
    const flag = force ? '/F' : '';
    return execPromise(`taskkill ${flag} /PID ${pid}`);
  }

  async killAll(pids, force) {
    for (const pid of pids) {
      await this.kill(pid, force);
    }
  }
}

module.exports = { WindowsFinder, WindowsKiller };
