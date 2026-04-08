const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');

const execPromise = util.promisify(exec);

class LinuxFinder {
  async findByPort(port) {
    try {
      return await this.findByPortSS(port);
    } catch {
      return await this.findByPortNetstat(port);
    }
  }

  async findByPortSS(port) {
    const { stdout } = await execPromise(`ss -tlnp`);
    const processes = [];
    const seen = new Set();
    const portStr = String(port);

    for (const line of stdout.split('\n')) {
      if (!line.includes(':' + portStr)) continue;

      const processInfo = this.extractProcessInfo(line);
      if (!processInfo) continue;

      if (seen.has(processInfo.pid)) continue;
      seen.add(processInfo.pid);

      processes.push({
        pid: processInfo.pid,
        name: processInfo.name,
        port,
        user: processInfo.user,
        cmd: await this.getCmdLine(processInfo.pid)
      });
    }
    return processes;
  }

  async findByPortNetstat(port) {
    const { stdout } = await execPromise(`netstat -tlnp`);
    const processes = [];
    const lines = stdout.split('\n');
    const portStr = ':' + port;

    for (const line of lines) {
      if (!line.includes(portStr) || !line.includes('LISTEN')) continue;

      const parts = line.split(/\s+/);
      if (parts.length < 7) continue;

      const processInfo = parts[6];
      const slashIdx = processInfo.indexOf('/');
      if (slashIdx < 0) continue;

      const pid = parseInt(processInfo.substring(0, slashIdx), 10);
      const name = processInfo.substring(slashIdx + 1);

      if (pid > 0) {
        processes.push({
          pid,
          name,
          port,
          user: parts[2],
          cmd: await this.getCmdLine(pid)
        });
      }
    }
    return processes;
  }

  async findByPattern(pattern) {
    const { stdout } = await execPromise(`ps aux`);
    const processes = [];
    const lines = stdout.split('\n');
    const re = new RegExp(pattern, 'i');

    for (const line of lines) {
      if (line.startsWith('USER')) continue;

      const parts = line.split(/\s+/);
      if (parts.length < 11) continue;

      const name = parts[10];
      if (!re.test(name)) continue;

      const pid = parseInt(parts[1], 10);
      processes.push({
        pid,
        name,
        user: parts[0],
        cmd: parts.slice(10).join(' ')
      });
    }
    return processes;
  }

  async listAll() {
    try {
      return await this.listAllSS();
    } catch {
      return await this.listAllNetstat();
    }
  }

  async listAllSS() {
    const { stdout } = await execPromise(`ss -tlnp`);
    const processes = [];
    const seen = new Set();

    for (const line of stdout.split('\n')) {
      if (line.startsWith('State') || !line || !line.includes('LISTEN')) continue;

      const port = this.extractPort(line);
      if (port === 0) continue;

      const processInfo = this.extractProcessInfo(line);
      if (!processInfo) continue;

      if (seen.has(processInfo.pid)) continue;
      seen.add(processInfo.pid);

      processes.push({
        pid: processInfo.pid,
        name: processInfo.name,
        port,
        user: processInfo.user,
        cmd: await this.getCmdLine(processInfo.pid)
      });
    }
    return processes;
  }

  // Extract port from line by finding the local address column
  extractPort(line) {
    // ss format: State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
    // Data lines have the port in the Local Address column
    // Try to find pattern like "0.0.0.0:PORT" or "[::]:PORT"
    const match = line.match(/(?:0\.0\.0\.0|127\.0\.0\.\d+|::1|\[::\]):(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 0;
  }

  // Extract process info from the users:((...),...) field
  extractProcessInfo(line) {
    // ss output has format: users:(("name",pid=1234,fd=X))
    // Or with user before it: users:((...),...)  root
    // The users field is always the last or second-to-last field

    // Try to find the users field
    const usersMatch = line.match(/users:\(\(([^)]+)\)\)/);
    if (!usersMatch) return null;

    const usersContent = usersMatch[1]; // e.g., '"python3",pid=253168,fd=3' or '"sshd",pid=1085,fd=3),("systemd",pid=1,fd=94)'

    // Extract name and pid from the first process entry
    const nameMatch = usersContent.match(/"([^"]+)"/);
    const pidMatch = usersContent.match(/pid=(\d+)/);

    if (!nameMatch || !pidMatch) return null;

    const name = nameMatch[1];
    const pid = parseInt(pidMatch[1], 10);

    // Extract user (if present, it's after the users field at a wider spacing)
    // The user appears after the users field with wide spacing
    let user = '';
    const afterUsers = line.substring(line.indexOf('users:'));
    const userMatch = afterUsers.match(/\)\)\s+(\S+)/);
    if (userMatch) {
      user = userMatch[1];
    }

    return { pid, name, user };
  }

  async listAllNetstat() {
    const { stdout } = await execPromise(`netstat -tlnp`);
    const processes = [];
    const lines = stdout.split('\n');
    const seen = new Set();

    for (const line of lines) {
      if (line.startsWith('Proto') || !line || !line.includes('LISTEN')) continue;

      const parts = line.split(/\s+/);
      if (parts.length < 7) continue;

      const localAddr = parts[3];
      const portMatch = localAddr.match(/:(\d+)$/);
      const port = portMatch ? parseInt(portMatch[1], 10) : 0;

      const processInfo = parts[6];
      const slashIdx = processInfo.indexOf('/');
      if (slashIdx < 0) continue;

      const pid = parseInt(processInfo.substring(0, slashIdx), 10);
      const name = processInfo.substring(slashIdx + 1);

      if (seen.has(pid)) continue;
      seen.add(pid);

      processes.push({
        pid,
        name,
        port,
        user: parts[2],
        cmd: await this.getCmdLine(pid)
      });
    }
    return processes;
  }

  async getCmdLine(pid) {
    try {
      const data = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
      return data.replace(/\0/g, ' ');
    } catch {
      return '';
    }
  }
}

class LinuxKiller {
  kill(pid, force) {
    const sig = force ? '9' : '15';
    return execPromise(`kill -${sig} ${pid}`);
  }

  async killAll(pids, force) {
    for (const pid of pids) {
      await this.kill(pid, force);
    }
  }
}

module.exports = { LinuxFinder, LinuxKiller };
