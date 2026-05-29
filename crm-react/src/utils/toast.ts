// Simple toast utility for notifications
let toastId = 0;

interface ToastOptions {
  duration?: number;
}

const createToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, options: ToastOptions = {}) => {
  const { duration = 5000 } = options;
  const id = `toast-${++toastId}`;
  
  // Create toast element
  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg p-4 shadow-lg transition-all duration-300 ${getToastStyles(type)}`;
  
  toast.innerHTML = `
    <div class="flex items-center">
      ${getToastIcon(type)}
      <span class="ml-3 text-sm font-medium">${message}</span>
      <button class="ml-auto text-gray-400 hover:text-gray-600" onclick="document.getElementById('${id}').remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
    }
  }, duration);
};

const getToastStyles = (type: string): string => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

const getToastIcon = (type: string): string => {
  switch (type) {
    case 'success':
      return '<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    case 'error':
      return '<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    case 'warning':
      return '<svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>';
    case 'info':
      return '<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    default:
      return '';
  }
};

const toast = {
  success: (message: string, options?: ToastOptions) => createToast('success', message, options),
  error: (message: string, options?: ToastOptions) => createToast('error', message, options),
  warning: (message: string, options?: ToastOptions) => createToast('warning', message, options),
  info: (message: string, options?: ToastOptions) => createToast('info', message, options),
};

export default toast;