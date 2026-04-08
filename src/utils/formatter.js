const pc = require('picocolors');
const { Confirm } = require('enquirer');

const styles = {
  title: (t) => pc.cyan(pc.bold(t)),
  header: (t) => pc.dim(pc.white(t)),
  success: (t) => pc.green(t),
  error: (t) => pc.red(t),
  warning: (t) => pc.yellow(t),
  info: (t) => pc.blue(t),
  muted: (t) => pc.gray(t),
  bold: (t) => pc.bold(t),
  highlight: (t) => pc.cyan(t),
  processPid: (t) => pc.yellow(t),
  processPort: (t) => pc.magenta(t),
  processName: (t) => pc.green(t),
  processUser: (t) => pc.blue(t),
};

function printProcesses(processes, verbose = false) {
  if (processes.length === 0) {
    console.log(pc.gray('No processes found'));
    return;
  }

  if (verbose) {
    console.log('');
    console.log(`  ${styles.header('PID')}        ${styles.header('PORT')}    ${styles.header('USER')}      ${styles.header('NAME')}        ${styles.header('CMD')}`);
    console.log(pc.gray('  ' + '─'.repeat(80)));
    for (const p of processes) {
      console.log(
        `  ${styles.processPid(String(p.pid).padEnd(8))} ${styles.processPort(String(p.port).padEnd(6))} ${styles.processUser((p.user || '-').padEnd(10))} ${styles.processName(p.name.padEnd(12))} ${pc.dim(p.cmd || '')}`
      );
    }
  } else {
    console.log('');
    console.log(`  ${styles.header('#')}   ${styles.header('PID')}        ${styles.header('PORT')}    ${styles.header('NAME')}`);
    console.log(pc.gray('  ' + '─'.repeat(50)));
    for (let i = 0; i < processes.length; i++) {
      const p = processes[i];
      const num = pc.dim(String(i + 1).padEnd(3));
      console.log(
        `  ${num} ${styles.processPid(String(p.pid).padEnd(8))} ${styles.processPort(String(p.port).padEnd(6))} ${styles.processName(p.name)}`
      );
    }
  }
  console.log('');
}

function printProcessesJSON(processes) {
  console.log(JSON.stringify(processes, null, 2));
}

async function confirm(message) {
  const prompt = new Confirm({
    name: 'confirm',
    message: message,
    initial: false,
  });

  try {
    return await prompt.run();
  } catch (err) {
    return false;
  }
}

function parsePort(s) {
  s = s.trim();
  s = s.replace(/^:/, '');
  const port = parseInt(s, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${s}`);
  }
  return port;
}

function parsePorts(s) {
  const parts = s.split(',').map(p => p.trim());
  return parts.map(parsePort);
}

module.exports = { printProcesses, printProcessesJSON, confirm, parsePort, parsePorts, styles };
