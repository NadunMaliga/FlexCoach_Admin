import React, { useState, useEffect } from 'react';
import Alert from '../Alert';
import { setAlertCallback } from '../utils/customAlert';

export default function AlertProvider({ children }) {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttonText: 'OK',
    isConfirm: false,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onClose: () => {},
    onConfirm: () => {},
    onCancel: () => {},
  });

  useEffect(() => {
    // Register the callback to show alerts
    setAlertCallback((config) => {
      setAlertConfig({ ...config, visible: true });
    });
  }, []);

  const handleClose = () => {
    if (alertConfig.onClose) {
      alertConfig.onClose();
    }
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const handleConfirm = () => {
    if (alertConfig.onConfirm) {
      alertConfig.onConfirm();
    }
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const handleCancel = () => {
    if (alertConfig.onCancel) {
      alertConfig.onCancel();
    }
    setAlertConfig({ ...alertConfig, visible: false });
  };

  return (
    <>
      {children}
      <Alert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText={alertConfig.buttonText}
        isConfirm={alertConfig.isConfirm}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onClose={handleClose}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
