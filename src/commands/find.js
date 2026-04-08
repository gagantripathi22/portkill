const { Command } = require('commander');
const { createFinder } = require('../index');
const { printProcesses, printProcessesJSON, styles } = require('../utils/formatter');

const findCmd = new Command('find');
findCmd
  .description('Find processes by name pattern')
  .argument('<pattern>', 'Process name pattern (regex)')
  .action(async (pattern) => {
    const options = findCmd.parent.opts();
    const json = options.json || false;
    const verbose = options.verbose || false;

    const finder = createFinder();

    let processes;
    try {
      processes = await finder.findByPattern(pattern);
    } catch (err) {
      console.error(`${styles.error('Error:')} Failed to find processes: ${err.message}`);
      process.exit(1);
    }

    if (processes.length === 0) {
      console.log(styles.muted(`No processes found matching '${pattern}'`));
      return;
    }

    if (json) {
      printProcessesJSON(processes);
    } else {
      printProcesses(processes, verbose);
    }
  });

module.exports = findCmd;
