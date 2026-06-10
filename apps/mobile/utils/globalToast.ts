import type { ToastVariant } from '@/components/ui';

interface GlobalToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

type ToastHandler = (options: GlobalToastOptions) => void;

// Міст між кодом поза React-деревом (MutationCache у QueryClient)
// і ToastProvider: провайдер реєструє свій showToast при монтуванні
let handler: ToastHandler | null = null;

export function registerGlobalToastHandler(fn: ToastHandler | null): void {
  handler = fn;
}

export function showGlobalToast(options: GlobalToastOptions): void {
  handler?.(options);
}

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string') return message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
