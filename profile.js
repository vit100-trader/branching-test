function getProfile(userId) {
  console.log(`Loading profile for user: ${userId}`);
  return { id: userId, name: 'Test User', role: 'dealer' };
}

function updateProfile(userId, data) {
  console.log(`Updating profile for user: ${userId}`);
  return { success: true, updated: data };
}

module.exports = { getProfile, updateProfile };
