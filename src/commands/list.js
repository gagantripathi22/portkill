const { Command } = require('commander');
const { createFinder, createKiller } = require('../index');
const { printProcesses, printProcessesJSON, parsePorts, styles } = require('../utils/formatter');
const { interactiveSelect } = require('../utils/interactive');

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
      const result = await interactiveSelect(processes);
      if (!result || result.action === 'cancel') {
        return;
      }

      const force = result.action === 'force';
      const proc = result.process;

      try {
        await killer.kill(proc.pid, force);
        console.log('');
        console.log(styles.success(`  ✓ Killed ${proc.name} (PID: ${proc.pid}) on port ${proc.port}`));
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
