(() => {
  // Ensure script doesn't run multiple times simultaneously if injected quickly
  if (document.getElementById('copy-url-notification-jhq')) {
    return;
  }

  const notification = document.createElement('div');
  notification.id = 'copy-url-notification-jhq'; // Unique ID
  notification.textContent = 'Copied Current URL';

  // Styling
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.padding = '10px 20px';
  notification.style.backgroundColor = '#333';
  notification.style.color = 'white';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '2147483647'; // Max z-index
  notification.style.fontFamily = 'sans-serif';
  notification.style.fontSize = '14px';
  notification.style.opacity = '0'; // Start transparent for fade-in
  notification.style.transition = 'opacity 0.5s ease-in-out';
  notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

  document.body.appendChild(notification);

  // Fade-in
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 50); // Short delay to ensure transition applies

  // Fade-out and remove
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500); // Wait for fade-out transition to complete
  }, 2000); // Keep notification visible for a short time before starting fade-out
})();
