const os = require('os');

let Finder, Killer;

switch (os.platform()) {
  case 'darwin':
    ({ DarwinFinder: Finder, DarwinKiller: Killer } = require('./platforms/darwin'));
    break;
  case 'win32':
    ({ WindowsFinder: Finder, WindowsKiller: Killer } = require('./platforms/windows'));
    break;
  default:
    ({ LinuxFinder: Finder, LinuxKiller: Killer } = require('./platforms/linux'));
}

function createFinder() {
  return new Finder();
}

function createKiller() {
  return new Killer();
}

module.exports = { createFinder, createKiller, Finder, Killer };
