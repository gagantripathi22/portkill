const { Command } = require('commander');
const { createFinder, createKiller } = require('../index');
const { printProcesses, confirm, parsePorts, styles } = require('../utils/formatter');

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
        console.error(`${styles.warning('Warning:')} Failed to find processes on port ${port}: ${err.message}`);
      }
    }

    if (allProcesses.length === 0) {
      console.log(styles.muted('No processes found'));
      return;
    }

    printProcesses(allProcesses, verbose);

    if (!yes) {
      const confirmed = await confirm(allProcesses);
      if (!confirmed) {
        console.log(styles.muted('Aborted'));
        return;
      }
    }

    let hasError = false;
    for (const p of allProcesses) {
      try {
        await killer.kill(p.pid, force);
        console.log(styles.success(`✓ Killed ${p.name} (PID: ${p.pid}) on port ${p.port}`));
      } catch (err) {
        console.error(styles.error(`✗ Failed to kill PID ${p.pid}: ${err.message}`));
        hasError = true;
      }
    }

    if (hasError) {
      process.exit(1);
    }
  });

module.exports = killAllCmd;
