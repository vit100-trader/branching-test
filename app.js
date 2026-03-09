const config = require('./config.json');
const { loginUser, logoutUser } = require('./login');
const { renderDashboard, refreshDashboard } = require('./dashboard');
const { getNotifications, markAsRead } = require('./notifications');

function startApp() {
  console.log(`Starting ${config.appName} v${config.version}`);
  console.log('Modules loaded: login, dashboard, notifications');
}

startApp();

module.exports = { startApp, loginUser, logoutUser, renderDashboard, refreshDashboard, getNotifications, markAsRead };
