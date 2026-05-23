import { Alert } from 'react-native';

export function confirmDestructive(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
): void {
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function showErrorAlert(message: string): void {
  Alert.alert('Error', message);
}

export function showAlert(title: string, message: string): void {
  Alert.alert(title, message);
}

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Proceed',
  cancelLabel = 'Cancel',
): void {
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}
