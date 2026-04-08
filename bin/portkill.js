#!/usr/bin/env node

const { Command } = require('commander');
const kill = require('../src/commands/kill');
const killAll = require('../src/commands/killAll');
const find = require('../src/commands/find');
const list = require('../src/commands/list');

const program = new Command();

program
  .name('portkill')
  .description('Kill processes running on specific ports. Cross-platform.')
  .version('1.0.0')
  .option('-f, --force', 'Force kill (SIGKILL on Unix, /F on Windows)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('-v, --verbose', 'Verbose output')
  .option('-i, --interactive', 'Interactive mode: select a port from a list')
  .option('--json', 'Output as JSON');

program.addCommand(kill);
program.addCommand(killAll);
program.addCommand(find);
program.addCommand(list);

program.parse(process.argv);
