function getNotifications(userId) {
  console.log(`Fetching notifications for: ${userId}`);
  return [{ id: 1, message: 'New lead assigned', read: false }];
}

function markAsRead(notificationId) {
  console.log(`Marking notification ${notificationId} as read`);
  return { success: true };
}

module.exports = { getNotifications, markAsRead };
