const config = require('./config.json');
const { loginUser, logoutUser } = require('./login');

function startApp() {
  console.log(`Starting ${config.appName} v${config.version}`);
  console.log('Modules loaded: login');
}

startApp();

module.exports = { startApp, loginUser, logoutUser };
