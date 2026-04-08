const { Command } = require('commander');
const { createFinder } = require('../index');
const { printProcesses, printProcessesJSON, parsePorts } = require('../utils/formatter');

const listCmd = new Command('list');
listCmd
  .description('List processes using specific ports (or all listening ports if no port specified)')
  .argument('[ports...]', 'Port numbers (optional, lists all if not specified)')
  .action(async (ports) => {
    const options = listCmd.parent.opts();
    const json = options.json || false;
    const verbose = options.verbose || false;

    const finder = createFinder();

    let processes = [];

    if (ports.length === 0) {
      try {
        processes = await finder.listAll();
      } catch (err) {
        console.error(`Failed to list processes: ${err.message}`);
        process.exit(1);
      }
    } else {
      const portList = parsePorts(ports.join(','));
      for (const port of portList) {
        try {
          const procs = await finder.findByPort(port);
          processes.push(...procs);
        } catch (err) {
          console.error(`Failed to find processes on port ${port}: ${err.message}`);
        }
      }
    }

    if (processes.length === 0) {
      console.log('No processes found');
      return;
    }

    if (json) {
      printProcessesJSON(processes);
    } else {
      printProcesses(processes, verbose);
    }
  });

module.exports = listCmd;
