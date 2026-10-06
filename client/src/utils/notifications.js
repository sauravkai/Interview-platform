const STORAGE_KEY = 'interview_ai_notifications';

export const getStoredNotifications = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to load notifications from storage.', error);
    return [];
  }
};

export const getNotificationsForUser = (userEmail = '') => {
  const notifications = getStoredNotifications();
  if (!userEmail) return notifications;

  const normalizedEmail = userEmail.toLowerCase();
  return notifications.filter((item) => {
    if (!item.recipientEmail) return true;
    return String(item.recipientEmail).toLowerCase() === normalizedEmail;
  });
};

export const addLiveRoomNotification = (roomId, details = {}) => {
  if (!roomId || typeof window === 'undefined') return null;

  const recipientEmail = details.recipientEmail || details.candidateEmail || details.email || '';
  const payload = {
    id: `live-room-${roomId}-${Date.now()}`,
    type: 'live-room-invite',
    title: details.title || 'Live room invitation',
    message:
      details.message ||
      'Your interviewer has shared a live interview room link for you to join.',
    roomId,
    recipientEmail: recipientEmail ? recipientEmail.toLowerCase() : '',
    candidateEmail: details.candidateEmail || recipientEmail || '',
    candidateName: details.candidateName || '',
    actionUrl: details.actionUrl || `/live-room/${roomId}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const existing = getStoredNotifications();
  const next = [payload, ...existing.filter((item) => {
    if (item.roomId !== roomId) return true;
    if (!recipientEmail) return false;
    return String(item.recipientEmail || '').toLowerCase() !== recipientEmail.toLowerCase();
  })].slice(0, 12);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('live-room-notification', { detail: payload }));
  }

  return payload;
};

export const markNotificationRead = (notificationId) => {
  if (typeof window === 'undefined') return [];

  const next = getStoredNotifications().map((item) =>
    item.id === notificationId ? { ...item, read: true } : item,
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const clearNotifications = () => {
  if (typeof window === 'undefined') return [];
  localStorage.removeItem(STORAGE_KEY);
  return [];
};
