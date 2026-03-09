function renderDashboard(user) {
  console.log(`Rendering dashboard for: ${user}`);
  return {
    widgets: ['sales', 'inventory', 'leads'],
    lastUpdated: new Date().toISOString()
  };
}

function refreshDashboard() {
  console.log('Refreshing dashboard data...');
}

module.exports = { renderDashboard, refreshDashboard };
