import { execSync } from 'node:child_process'
import packageDetails from '../package.json' with { type: 'json' }

/** @type {import('electron-builder').Configuration} */
export default {
  appId: `io.freetubeapp.${packageDetails.name}`,
  copyright: 'Copyleft © 2020-2026 freetubeapp@protonmail.com',
  // asar: false,
  // compression: 'store',
  productName: packageDetails.productName,
  directories: {
    output: './build/',
  },
  protocols: [
    {
      name: 'FreeTube',
      schemes: [
        'freetube'
      ]
    }
  ],
  files: [
    '_icons/iconColor.*',
    'icon.svg',
    './dist/**/*',
    '!dist/web/*',
    '!node_modules/**/*',
  ],

  // As we bundle all dependecies with webpack, the `node_modules` folder is excluded from packaging in the `files` array.
  // electron-builder will however still spend time scanning the `node_modules` folder and building up a list of dependencies,
  // returning `false` from the `beforeBuild` hook skips that.
  beforeBuild: () => Promise.resolve(false),

  // Strip extended attributes (Finder info, resource forks) from the packaged
  // app before codesign runs, otherwise ad-hoc signing fails with
  // "resource fork, Finder information, or similar detritus not allowed"
  // when building from a directory that Finder/iCloud has decorated with xattrs.
  afterPack: (context) => {
    if (context.electronPlatformName === 'darwin') {
      execSync(`xattr -cr "${context.appOutDir}"`)
    }
  },
  dmg: {
    contents: [
      {
        path: '/Applications',
        type: 'link',
        x: 410,
        y: 230,
      },
      {
        type: 'file',
        x: 130,
        y: 230,
      },
    ],
    window: {
      height: 380,
      width: 540,
    }
  },
  linux: {
    category: 'Network',
    icon: '_icons/icon.svg',
    target: ['deb', 'zip', '7z', 'rpm', 'AppImage', 'pacman'],
  },
  // See the following issues for more information
  // https://github.com/jordansissel/fpm/issues/1503
  // https://github.com/jgraph/drawio-desktop/issues/259
  rpm: {
    fpm: ['--rpm-rpmbuild-define=_build_id_links none']
  },
  deb: {
    depends: [
      'libgtk-3-0',
      'libnotify4',
      'libnss3',
      'libxss1',
      'libxtst6',
      'xdg-utils',
      'libatspi2.0-0',
      'libuuid1',
      'libsecret-1-0'
    ]
  },
  mac: {
    category: 'public.app-category.utilities',
    icon: '_icons/iconMac.icns',
    target: ['dmg', 'zip', '7z'],
    type: 'distribution',
    extendInfo: {
      CFBundleURLTypes: [
        'freetube'
      ],
      CFBundleURLSchemes: [
        'freetube'
      ]
    }
  },
  win: {
    icon: '_icons/icon.ico',
    target: ['nsis', 'zip', '7z', 'portable'],
  },
  nsis: {
    allowToChangeInstallationDirectory: true,
    oneClick: false,
  },
}
