function loginUser(username, password) {
  console.log(`Authenticating user: ${username}`);
  // TODO: implement actual authentication
  return { success: true, token: 'mock-token-123' };
}

function logoutUser() {
  console.log('User logged out');
  return { success: true };
}

module.exports = { loginUser, logoutUser };
