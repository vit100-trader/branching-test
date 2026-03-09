const config = require('./config.json');
const { loginUser, logoutUser } = require('./login');
const { renderDashboard, refreshDashboard } = require('./dashboard');

function startApp() {
  console.log(`Starting ${config.appName} v${config.version}`);
  console.log('Modules loaded: login, dashboard');
}

startApp();

module.exports = { startApp, loginUser, logoutUser, renderDashboard, refreshDashboard };
