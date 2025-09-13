import { useToastStore } from '@/stores/toastStore'

/**
 * Hook for showing toast notifications
 */
export function useToast() {
  const { addToast, removeToast, toasts } = useToastStore()

  const toast = ({ title, description, variant = 'default', duration = 5000 }) => {
    addToast({
      title,
      description,
      variant,
      duration,
    })
  }

  return {
    toast,
    toasts,
    dismiss: removeToast,
  }
}
