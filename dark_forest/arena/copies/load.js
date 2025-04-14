const fs = require('fs')
const { spawnSync } = require('child_process');

/* usage: load.js <package_name> <version> */

if (process.argv.length !== 4) throw new Error (`usage: load.js <package_name> <version>`)

const packageName = process.argv[2];
const version = process.argv[3];

const packagePath = '../packages/' + packageName;
const destPath = './' + packageName;

if (!fs.existsSync(packagePath)) throw new Error (`${packagePath} not found`);

// Copy from packages to copies
try {
    if (fs.existsSync(destPath))  spawnSync('rm', ['-r', `${destPath}`])
    // Need to copy symbolic link https://unix.stackexchange.com/questions/56084/how-do-i-copy-a-symbolic-link
    spawnSync('cp', ['-R','-P', `${packagePath}`, `${destPath}`])
    console.log('copied', packagePath, 'to', destPath);
  } catch(err) {
    console.error(err)
}

// Load package.json
const packageJson = require(destPath + '/package.json');

const newPackageJson = JSON.parse(JSON.stringify(packageJson));

const author = 'dfdao <0xcha0sg0d@gmail.com>';
const name = '@dfdao/' + packageName;

// Update package.json
newPackageJson.name = name;
newPackageJson.version = version;
newPackageJson.author = author;

const packageJsonCopy = destPath + `/package.json`;

if (!fs.existsSync(packageJsonCopy)) throw new Error (`${packageJsonCopy} not found`);

// Write new package.json to copies
try {
    fs.writeFileSync(packageJsonCopy, JSON.stringify(newPackageJson, null, 4));
    console.log(`wrote new ${packageName} to file`)
    //file removed
  } catch(err) {
    console.error(err)
}

// Publish new package

