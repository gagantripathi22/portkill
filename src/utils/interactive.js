const pc = require('picocolors');
const { Select, prompt } = require('enquirer');

async function interactiveSelect(processes) {
  if (processes.length === 0) {
    console.log(pc.gray('No processes found'));
    return null;
  }

  console.log('');
  console.log(pc.cyan('  ╔═══════════════════════════════════════════════╗'));
  console.log(pc.cyan('  ║') + pc.bold(pc.white('             portkill - Interactive Mode              ')) + pc.cyan('║'));
  console.log(pc.cyan('  ╚═══════════════════════════════════════════════╝'));
  console.log('');
  console.log(pc.dim('  Use ') + pc.yellow('↑↓') + pc.dim(' arrows to navigate, ') + pc.green('Enter') + pc.dim(' to select'));
  console.log('');

  // Create choices for enquirer - value is the process object itself
  const choices = processes.map((p, i) => ({
    name: `${String(p.port).padEnd(6)} ${p.name.padEnd(15)} (PID: ${p.pid})`,
    value: p,
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
      answer: (state, choice, selected) => {
        if (selected) {
          return pc.cyan('❯ ') + pc.bgCyan(pc.black(` ${choice.message} `));
        }
        return '  ' + choice.message;
      },
      selected: (state, choice, selected) => {
        return pc.cyan('❯ ') + pc.bgCyan(pc.black(` ${choice.message} `));
      },
      cursor: () => pc.cyan('❯'),
    },
  });

  let selected;
  try {
    selected = await selectedPrompt.run();
  } catch (err) {
    console.log(pc.gray('\n  Cancelled\n'));
    return null;
  }

  if (!selected) {
    console.log(pc.gray('\n  Cancelled\n'));
    return null;
  }

  // Action selection
  console.log('');
  console.log(pc.green(`  Selected: ${pc.bold(selected.name)} (PID: ${selected.pid}) on port ${pc.magenta(selected.port)}`));
  console.log('');
  console.log(pc.dim('  What do you want to do?'));
  console.log('');

  const actionPrompt = new Select({
    name: 'action',
    message: 'Choose action:',
    choices: [
      {
        name: 'kill',
        message: `  ${pc.green('Kill')}       ${pc.dim('SIGTERM - graceful shutdown')}`,
      },
      {
        name: 'force',
        message: `  ${pc.red('Force Kill')}   ${pc.dim('SIGKILL - immediate termination')}`,
      },
      {
        name: 'cancel',
        message: `  ${pc.gray('Cancel')}`,
      },
    ],
    initial: 0,
    showAlerts: false,
    styles: {
      selected: (state, choice) => {
        return pc.cyan('❯ ') + pc.green(choice.message);
      },
      cursor: () => pc.cyan('❯'),
    },
  });

  let action;
  try {
    action = await actionPrompt.run();
  } catch (err) {
    console.log(pc.gray('\n  Cancelled\n'));
    return null;
  }

  return { process: selected, action };
}

module.exports = { interactiveSelect };
