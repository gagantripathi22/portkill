const { Command } = require('commander');
const { createFinder, createKiller } = require('../index');
const { printProcesses, confirm, parsePort } = require('../utils/formatter');

const killCmd = new Command('kill');
killCmd
  .description('Kill process running on a specific port')
  .argument('<port>', 'Port number')
  .action(async (portStr) => {
    const port = parsePort(portStr);
    const options = killCmd.parent.opts();
    const force = options.force || false;
    const verbose = options.verbose || false;
    const yes = options.yes || false;

    const finder = createFinder();
    const killer = createKiller();

    let processes;
    try {
      processes = await finder.findByPort(port);
    } catch (err) {
      console.error(`Failed to find processes: ${err.message}`);
      process.exit(1);
    }

    if (processes.length === 0) {
      console.log(`No process found on port ${port}`);
      return;
    }

    printProcesses(processes, verbose);

    if (!yes) {
      const confirmed = await confirm(processes);
      if (!confirmed) {
        console.log('Aborted');
        return;
      }
    }

    let lastErr = null;
    for (const p of processes) {
      try {
        await killer.kill(p.pid, force);
        console.log(`Killed PID ${p.pid} (${p.name}) on port ${p.port}`);
      } catch (err) {
        console.error(`Failed to kill PID ${p.pid}: ${err.message}`);
        lastErr = err;
      }
    }

    if (lastErr) {
      process.exit(1);
    }
  });

module.exports = killCmd;
