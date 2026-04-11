const pc = require('picocolors');
const { Select } = require('enquirer');

async function interactiveSelect(processes) {
  if (processes.length === 0) {
    console.log(pc.gray('No processes found'));
    return null;
  }

  while (true) {
    console.log(pc.dim('\n  ───────────────────────────────────────────'));
    console.log(pc.cyan('  portkill') + pc.dim(' — select a process to kill'));
    console.log(pc.dim('  ───────────────────────────────────────────\n'));
    console.log(pc.dim('  ↑↓ navigate • Enter select • q quit\n'));

    const choices = processes.map((p, i) => ({
      value: i,
      message: `  ${pc.magenta(String(p.port).padEnd(6))} ${pc.green(p.name.padEnd(15))} ${pc.dim(`PID: ${p.pid}`)}`,
    }));

    const selectedPrompt = new Select({
      name: 'process',
      message: '',
      choices,
      initial: 0,
      showAlerts: false,
      clearPromptOnDone: false,
      styles: {
        selected: () => '',
        cursor: () => pc.cyan('▸ '),
      },
    });

    let selectedIndex;
    try {
      selectedIndex = await selectedPrompt.run();
    } catch (err) {
      console.log(pc.gray('\n  Cancelled\n'));
      return null;
    }

    if (selectedIndex === undefined) {
      console.log(pc.gray('\n  Cancelled\n'));
      return null;
    }

    const selected = processes[selectedIndex];

    while (true) {
      console.log(pc.dim('\n  ───────────────────────────────────────────'));
      console.log(pc.cyan('  portkill') + pc.dim(' — choose action\n'));
      console.log(`  ${pc.green(selected.name)} ${pc.dim(`PID: ${selected.pid} • port ${pc.magenta(selected.port)}`)}`);
      console.log(pc.dim('  ───────────────────────────────────────────\n'));

      const actionPrompt = new Select({
        name: 'action',
        message: '',
        choices: [
          { value: 'kill', message: `  ${pc.green('Kill')}${pc.dim('         SIGTERM - graceful shutdown')}` },
          { value: 'force', message: `  ${pc.red('Force Kill')}${pc.dim('    SIGKILL - immediate termination')}` },
          { value: 'back', message: `  ${pc.gray('Back')}${pc.dim('          select different process')}` },
        ],
        initial: 0,
        showAlerts: false,
        clearPromptOnDone: false,
        styles: {
          selected: () => '',
          cursor: () => pc.cyan('▸ '),
        },
      });

      let action;
      try {
        action = await actionPrompt.run();
      } catch (err) {
        console.log(pc.gray('\n  Cancelled\n'));
        return null;
      }

      if (action === 'back') {
        break;
      }

      if (action === 'kill' || action === 'force') {
        return { process: selected, action };
      }
    }
  }
}

module.exports = { interactiveSelect };
