const config = require('./config.json');
const { renderDashboard, refreshDashboard } = require('./dashboard');

function startApp() {
  console.log(`Starting ${config.appName} v${config.version}`);
  console.log('Modules loaded: dashboard');
}

startApp();

module.exports = { startApp, renderDashboard, refreshDashboard };
