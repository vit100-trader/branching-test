const config = require('./config.json');

function startApp() {
  console.log(`Starting ${config.appName} v${config.version}`);
  console.log('Modules loaded: none');
}

startApp();

module.exports = { startApp };
