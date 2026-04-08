const pc = require('picocolors');
const prompts = require('prompts');

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

async function confirm(processes) {
  const { value } = await prompts({
    type: 'confirm',
    name: 'value',
    message: `${styles.warning(`Kill ${processes.length} process(es)?`)} ${pc.dim('(y/N)')}`,
    initial: false,
  });
  return value;
}

async function interactiveSelect(processes, action = 'kill') {
  if (processes.length === 0) {
    console.log(pc.gray('No processes found'));
    return;
  }

  console.log('');
  console.log(styles.title('  ┌─────────────────────────────────────────────┐'));
  console.log(styles.title('  │           portkill - Interactive              │'));
  console.log(styles.title('  └─────────────────────────────────────────────┘'));
  console.log('');

  const choices = processes.map((p, i) => ({
    title: `${styles.processPort(String(p.port).padEnd(6))} ${styles.processName(p.name.padEnd(15))} ${styles.muted(`(PID: ${p.pid})`)}`,
    value: i,
    description: p.cmd ? pc.dim(p.cmd.substring(0, 50)) : '',
  }));

  const { selected } = await prompts({
    type: 'select',
    name: 'selected',
    message: 'Select a process:',
    choices,
    initial: 0,
  });

  if (selected === undefined) {
    console.log(pc.gray('\n  Cancelled\n'));
    return null;
  }

  const process = processes[selected];

  // Action selection
  console.log('');
  console.log(styles.title(`  Selected: ${styles.processName(process.name)} ${styles.muted(`(PID: ${process.pid})`)} on ${styles.processPort(`port ${process.port}`)}`));
  console.log('');

  const { action: chosenAction } = await prompts({
    type: 'select',
    name: 'action',
    message: 'What to do?',
    choices: [
      { title: `${styles.success('→ Kill')}     ${pc.dim('SIGTERM - graceful shutdown')}`, value: 'kill' },
      { title: `${styles.error('× Force Kill')}${pc.dim('  SIGKILL - immediate termination')}`, value: 'force' },
      { title: `${styles.muted('↺ Cancel')}`, value: 'cancel' },
    ],
    initial: 0,
  });

  return { process, action: chosenAction };
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

module.exports = { printProcesses, printProcessesJSON, confirm, interactiveSelect, parsePort, parsePorts, styles };
