// Simple toast utility for showing messages
export function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `fixed top-6 right-6 z-[9999] px-6 py-3 rounded-lg shadow-lg text-white font-semibold text-base transition-all duration-300 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
  toast.style.opacity = '0';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '1'; }, 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}
