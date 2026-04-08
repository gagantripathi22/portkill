const readline = require('readline');

function printProcesses(processes, verbose = false) {
  if (processes.length === 0) {
    console.log('No processes found');
    return;
  }

  if (verbose) {
    console.log('PID\tPORT\tUSER\tNAME\tCMD');
    for (const p of processes) {
      console.log(`${p.pid}\t${p.port}\t${p.user}\t${p.name}\t${p.cmd}`);
    }
  } else {
    console.log('PID\tPORT\tNAME');
    for (const p of processes) {
      console.log(`${p.pid}\t${p.port}\t${p.name}`);
    }
  }
}

function printProcessesJSON(processes) {
  console.log(JSON.stringify(processes, null, 2));
}

function confirm(processes) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`Kill ${processes.length} process(es)? (y/N): `, (answer) => {
      rl.close();
      resolve(answer === 'y' || answer === 'Y');
    });
  });
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

module.exports = { printProcesses, printProcessesJSON, confirm, parsePort, parsePorts };
