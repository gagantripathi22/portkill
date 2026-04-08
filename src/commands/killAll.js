const { Command } = require('commander');
const { createFinder, createKiller } = require('../index');
const { printProcesses, confirm, parsePorts } = require('../utils/formatter');

const killAllCmd = new Command('kill-all');
killAllCmd
  .description('Kill processes on multiple ports')
  .argument('<ports>', 'Comma-separated port numbers')
  .action(async (portsStr) => {
    const ports = parsePorts(portsStr);
    const options = killAllCmd.parent.opts();
    const force = options.force || false;
    const verbose = options.verbose || false;
    const yes = options.yes || false;

    const finder = createFinder();
    const killer = createKiller();

    const allProcesses = [];

    for (const port of ports) {
      try {
        const processes = await finder.findByPort(port);
        allProcesses.push(...processes);
      } catch (err) {
        console.error(`Failed to find processes on port ${port}: ${err.message}`);
      }
    }

    if (allProcesses.length === 0) {
      console.log('No processes found');
      return;
    }

    printProcesses(allProcesses, verbose);

    if (!yes) {
      const confirmed = await confirm(allProcesses);
      if (!confirmed) {
        console.log('Aborted');
        return;
      }
    }

    let lastErr = null;
    for (const p of allProcesses) {
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

module.exports = killAllCmd;
