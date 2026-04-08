const pc = require('picocolors');
const { Select } = require('enquirer');

// Clear screen helper
const clear = () => {
  process.stdout.write('\x1b[2J');
  process.stdout.write('\x1b[H');
};

async function interactiveSelect(processes) {
  if (processes.length === 0) {
    console.log(pc.gray('No processes found'));
    return null;
  }

  while (true) {
    clear();
    console.log('');
    console.log(pc.cyan('  ╔═══════════════════════════════════════════════╗'));
    console.log(pc.cyan('  ║') + pc.bold(pc.white('             portkill - Interactive Mode              ')) + pc.cyan('║'));
    console.log(pc.cyan('  ╚═══════════════════════════════════════════════╝'));
    console.log('');
    console.log(pc.dim('  Use ') + pc.yellow('↑↓') + pc.dim(' arrows to navigate, ') + pc.green('Enter') + pc.dim(' to select, ') + pc.red('q') + pc.dim(' to quit'));
    console.log('');

    // Create choices for enquirer - value is index, message is display
    const choices = processes.map((p, i) => ({
      value: i,
      message: `${pc.magenta(String(p.port).padEnd(6))} ${pc.green(p.name.padEnd(15))} ${pc.dim(`PID: ${p.pid}`)}`,
    }));

    const selectedPrompt = new Select({
      name: 'process',
      message: 'Select a process to kill:',
      choices,
      initial: 0,
      showAlerts: false,
      styles: {
        afterSound: '',
        selected: () => '',
        cursor: () => pc.cyan('▸ '),
      },
    });

    let selectedIndex;
    try {
      selectedIndex = await selectedPrompt.run();
    } catch (err) {
      clear();
      console.log(pc.gray('\n  Goodbye!\n'));
      return null;
    }

    if (selectedIndex === undefined) {
      clear();
      console.log(pc.gray('\n  Goodbye!\n'));
      return null;
    }

    const selected = processes[selectedIndex];

    // Action selection loop
    while (true) {
      clear();
      console.log('');
      console.log(pc.cyan('  ╔═══════════════════════════════════════════════╗'));
      console.log(pc.cyan('  ║') + pc.bold(pc.white('                 Choose Action                        ')) + pc.cyan('║'));
      console.log(pc.cyan('  ╚═══════════════════════════════════════════════╝'));
      console.log('');
      console.log(pc.green(`  Selected: ${pc.bold(selected.name)} (PID: ${selected.pid}) on port ${pc.magenta(selected.port)}`));
      console.log('');
      console.log(pc.dim('  Use ') + pc.yellow('↑↓') + pc.dim(' arrows to navigate, ') + pc.green('Enter') + pc.dim(' to confirm'));
      console.log('');

      const actionPrompt = new Select({
        name: 'action',
        message: 'Choose action:',
        choices: [
          {
            value: 'kill',
            message: `  ${pc.green('Kill')}         ${pc.dim('SIGTERM - graceful shutdown')}`,
          },
          {
            value: 'force',
            message: `  ${pc.red('Force Kill')}    ${pc.dim('SIGKILL - immediate termination')}`,
          },
          {
            value: 'back',
            message: `  ${pc.gray('Back')}          ${pc.dim('Select a different process')}`,
          },
        ],
        initial: 0,
        showAlerts: false,
        styles: {
          selected: () => '',
          cursor: () => pc.cyan('▸ '),
        },
      });

      let action;
      try {
        action = await actionPrompt.run();
      } catch (err) {
        clear();
        console.log(pc.gray('\n  Goodbye!\n'));
        return null;
      }

      if (action === 'back') {
        // Go back to process selection
        break;
      }

      if (action === 'kill' || action === 'force') {
        clear();
        return { process: selected, action };
      }
    }
    // Loop continues to show process selection again
  }
}

module.exports = { interactiveSelect };
