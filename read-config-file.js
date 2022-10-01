/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const findConfig = require('find-config');
const path = require('path');

const readConfigFile = (CZ_CONFIG_NAME = 'czconfig.json') => {
  // First try to find the .cz-config.js config file
  // It seems like find-config still locates config files in the home directory despite of the home:false prop.
  const czConfig = findConfig.require(CZ_CONFIG_NAME, { home: false });

  if (czConfig) {
    return czConfig;
  }

  // fallback to locating it using the config block in the nearest package.json
  let pkg = findConfig('package.json', { home: false });

  if (pkg) {
    const pkgDir = path.dirname(pkg);

    pkg = require(pkg);

    if (
      pkg.config &&
      pkg.config['cz-jira-keys'] &&
      pkg.config['cz-jira-keys'].config
    ) {
      // resolve relative to discovered package.json
      const pkgPath = path.resolve(pkgDir, pkg.config['cz-jira-keys'].config);

      return require(pkgPath);
    }
  }

  /* istanbul ignore next */
  return null;
};

module.exports = readConfigFile;
