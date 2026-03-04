export const showNextPrayerNotification = (mins, name) => {
  new Notification(name, {
    body: `${name} is in ${mins} minutes`,
    icon: "/assets/images/icon128.png",
  });
};

export const showCurrentPrayerNotification = (name) => {
  new Notification(name, {
    body: `${name} is now`,
    icon: "/assets/images/icon128.png",
  });
};
