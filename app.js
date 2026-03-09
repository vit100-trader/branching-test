const config = require('./config.json');
const { loginUser, logoutUser } = require('./login');
const { renderDashboard, refreshDashboard } = require('./dashboard');
const { getProfile, updateProfile } = require('./profile');

function startApp() {
  console.log(`Starting ${config.appName} v${config.version}`);
  console.log('Modules loaded: login, dashboard, profile');
}

startApp();

module.exports = { startApp, loginUser, logoutUser, renderDashboard, refreshDashboard, getProfile, updateProfile };
