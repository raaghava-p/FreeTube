import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { Arch, build, Platform } from 'electron-builder'
import config from './ebuilder.config.mjs'

const args = process.argv

/** @type {Map<import('electron-builder').Platform, Map<import('electron-builder').Arch, Array<string>>>} */
let targets
const platform = process.platform

if (platform === 'darwin') {
  // default to the host architecture so Apple Silicon Macs get a native
  // arm64 build instead of an x64 one that runs under Rosetta
  let arch = process.arch === 'arm64' ? Arch.arm64 : Arch.x64

  if (args[2] === 'arm64') {
    arch = Arch.arm64
  } else if (args[2] === 'x64') {
    arch = Arch.x64
  }

  targets = Platform.MAC.createTarget(['DMG', 'zip', '7z'], arch)
} else if (platform === 'win32') {
  let arch = Arch.x64

  if (args[2] === 'arm64') {
    arch = Arch.arm64
  }

  targets = Platform.WINDOWS.createTarget(['nsis', 'zip', '7z', 'portable'], arch)
} else if (platform === 'linux') {
  let arch = Arch.x64

  if (args[2] === 'arm64') {
    arch = Arch.arm64
  }

  if (args[2] === 'arm32') {
    arch = Arch.armv7l
  }

  targets = Platform.LINUX.createTarget(['deb', 'zip', '7z', 'rpm', 'AppImage', 'pacman'], arch)
}

// On macOS, package outside iCloud-synced folders (like ~/Documents):
// the iCloud file provider re-adds Finder info xattrs to freshly packaged
// files faster than electron-builder can codesign them, which makes signing
// fail with "resource fork, Finder information, or similar detritus not allowed".
// The finished artifacts are copied back into ./build afterwards.
let darwinTempOutput
if (platform === 'darwin') {
  darwinTempOutput = join(tmpdir(), 'freetube-build')
  // stale output from a previous run breaks the codesign seal of the new app
  rmSync(darwinTempOutput, { recursive: true, force: true })
  config.directories.output = darwinTempOutput
}

try {
  const output = await build({ targets, config, publish: 'never' })
  console.log(output)

  if (darwinTempOutput) {
    mkdirSync('./build', { recursive: true })

    for (const artifact of output) {
      cpSync(artifact, join('./build', basename(artifact)), { recursive: true })
    }

    console.log('Copied artifacts to ./build')
  }
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
