#!/usr/bin/env node

const { Command } = require('commander');
const pc = require('picocolors');
const kill = require('../src/commands/kill');
const killAll = require('../src/commands/killAll');
const find = require('../src/commands/find');
const list = require('../src/commands/list');

const program = new Command();

program
  .name('portkill')
  .version('1.0.0')
  .description(`${pc.cyan('portkill')} ${pc.dim('—')} Find and kill processes by port\n${pc.dim('Works on Linux, macOS, and Windows')}`)
  .option('-f, --force', 'Force kill (SIGKILL / /F)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('-v, --verbose', 'Verbose output')
  .option('-i, --interactive', 'Interactive mode: select a port with arrow keys')
  .option('--json', 'Output as JSON');

program.addCommand(kill);
program.addCommand(killAll);
program.addCommand(find);
program.addCommand(list);

program.configureHelp({
  formatHelp: (cmd, helper) => {
    const description = cmd.description() || '';
    const options = helper.visibleOptions(cmd);
    const commands = helper.visibleCommands(cmd);

    let output = `\n  ${pc.cyan(pc.bold('portkill'))} ${pc.dim('v' + cmd.version())}\n`;
    output += `  ${pc.dim('─'.repeat(50))}\n`;
    output += `\n  ${description}\n`;

    if (options.length > 0) {
      output += `\n  ${pc.bold('Options:')}\n`;
      for (const option of options) {
        const opt = pc.yellow(`-${option.short ? option.short + ', ' : '  '}${option.long}`);
        const desc = pc.dim(option.description || '');
        output += `    ${opt.padEnd(20)} ${desc}\n`;
      }
    }

    if (commands.length > 0) {
      output += `\n  ${pc.bold('Commands:')}\n`;
      for (const cmd of commands) {
        const name = pc.green(cmd.name());
        const desc = pc.dim(cmd.description() || '');
        output += `    ${name.padEnd(15)} ${desc}\n`;
      }
    }

    output += `\n`;
    return output;
  }
});

program.parse(process.argv);
