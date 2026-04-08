const { Command } = require('commander');
const { createFinder, createKiller } = require('../index');
const { printProcesses, printProcessesJSON, parsePorts, interactiveSelect, styles } = require('../utils/formatter');

const listCmd = new Command('list');
listCmd
  .description('List processes using specific ports')
  .argument('[ports...]', 'Port numbers (optional, lists all if not specified)')
  .action(async (ports) => {
    const options = listCmd.parent.opts();
    const json = options.json || false;
    const verbose = options.verbose || false;
    const interactive = options.interactive || false;

    const finder = createFinder();
    const killer = createKiller();

    let processes = [];

    if (ports.length === 0) {
      try {
        processes = await finder.listAll();
      } catch (err) {
        console.error(`${styles.error('Error:')} Failed to list processes: ${err.message}`);
        process.exit(1);
      }
    } else {
      const portList = parsePorts(ports.join(','));
      for (const port of portList) {
        try {
          const procs = await finder.findByPort(port);
          processes.push(...procs);
        } catch (err) {
          console.error(`${styles.error('Error:')} Failed to find processes on port ${port}: ${err.message}`);
        }
      }
    }

    if (processes.length === 0) {
      console.log(styles.muted('No processes found'));
      return;
    }

    if (json) {
      printProcessesJSON(processes);
      return;
    }

    // When no ports specified, default to interactive mode
    if (interactive || ports.length === 0) {
      const result = await interactiveSelect(processes, 'kill');
      if (!result || result.action === 'cancel') {
        return;
      }

      const { process, action } = result;
      const force = action === 'force';

      try {
        await killer.kill(process.pid, force);
        console.log('');
        console.log(styles.success(`  ✓ Killed ${process.name} (PID: ${process.pid}) on port ${process.port}`));
        console.log('');
      } catch (err) {
        console.error('');
        console.error(styles.error(`  ✗ Failed to kill: ${err.message}`));
        console.log('');
        process.exit(1);
      }
      return;
    }

    printProcesses(processes, verbose);
  });

module.exports = listCmd;
