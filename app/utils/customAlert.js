// Custom Alert utility for FlexCoach Admin
// Provides a consistent, styled alert system across the app

let alertCallback = null;

export const setAlertCallback = (callback) => {
  alertCallback = callback;
};

export const showAlert = (title, message, buttonText = 'OK', onClose = null) => {
  if (alertCallback) {
    alertCallback({
      visible: true,
      title,
      message,
      buttonText,
      onClose: onClose || (() => {}),
    });
  } else {
    // Fallback to native Alert if custom alert not initialized
    console.warn('Custom Alert not initialized, using native Alert');
    const { Alert } = require('react-native');
    Alert.alert(title, message, [{ text: buttonText, onPress: onClose }]);
  }
};

// Convenience methods
export const showSuccess = (message, onClose) => {
  showAlert('Success', message, 'OK', onClose);
};

export const showError = (message, onClose) => {
  showAlert('Error', message, 'OK', onClose);
};

export const showWarning = (message, onClose) => {
  showAlert('Warning', message, 'OK', onClose);
};

export const showInfo = (message, onClose) => {
  showAlert('Info', message, 'OK', onClose);
};

export const showConfirm = (title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel) => {
  if (alertCallback) {
    alertCallback({
      visible: true,
      title,
      message,
      confirmText,
      cancelText,
      isConfirm: true,
      onConfirm: onConfirm || (() => {}),
      onCancel: onCancel || (() => {}),
    });
  } else {
    // Fallback to native Alert
    console.warn('Custom Alert not initialized, using native Alert');
    const { Alert } = require('react-native');
    Alert.alert(title, message, [
      { text: cancelText, onPress: onCancel, style: 'cancel' },
      { text: confirmText, onPress: onConfirm }
    ]);
  }
};
