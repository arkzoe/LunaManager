const path = require('path')
const fs = require('fs')

exports.default = async function (context) {
  const appOutDir = context.appOutDir

  const localesDir = path.join(appOutDir, 'locales')
  if (fs.existsSync(localesDir)) {
    const keep = new Set(['zh-CN.pak'])
    for (const file of fs.readdirSync(localesDir)) {
      if (!keep.has(file)) {
        const filePath = path.join(localesDir, file)
        fs.unlinkSync(filePath)
        console.log(`  removed locale: ${file}`)
      }
    }
  }

  const licenseFile = path.join(appOutDir, 'LICENSES.chromium.html')
  if (fs.existsSync(licenseFile)) {
    fs.unlinkSync(licenseFile)
    console.log('  removed LICENSES.chromium.html')
  }

  const licenseTxt = path.join(appOutDir, 'LICENSE.electron.txt')
  if (fs.existsSync(licenseTxt)) {
    fs.unlinkSync(licenseTxt)
    console.log('  removed LICENSE.electron.txt')
  }
}
