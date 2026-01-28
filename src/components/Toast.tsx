import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, HelpCircle } from 'lucide-react';
import { useToastStore, Toast as ToastType } from '../store/useToastStore';

const icons = {
  success: <CheckCircle className="text-green-500" size={20} />,
  error: <AlertCircle className="text-red-500" size={20} />,
  warning: <AlertTriangle className="text-yellow-500" size={20} />,
  info: <Info className="text-blue-500" size={20} />,
  confirm: <HelpCircle className="text-purple-500" size={28} />,
};

const ToastItem = ({ toast, isModal = false }: { toast: ToastType; isModal?: boolean }) => {
  const { removeToast } = useToastStore();
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toast.id), 200);
  };

  const handleConfirm = () => {
    if (toast.onConfirm) toast.onConfirm();
    handleDismiss();
  };

  const handleCancel = () => {
    if (toast.onCancel) toast.onCancel();
    handleDismiss();
  };

  const baseClasses = "bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto transition-all duration-200";
  
  // Notification: Top-right slide in/out
  const notificationClasses = `
    p-4 w-80
    ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
    animate-in slide-in-from-right-4 fade-in
  `;
  
  // Modal: Centered zoom in/out
  const modalClasses = `
    p-6 w-[400px] max-w-[90vw]
    ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
    animate-in zoom-in-95 fade-in slide-in-from-bottom-2
  `;

  return (
    <div className={`${baseClasses} ${isModal ? modalClasses : notificationClasses}`}>
      <div className={`flex ${isModal ? 'flex-col items-center text-center gap-4' : 'items-start gap-3'}`}>
        
        {/* Icon */}
        <div className={isModal ? 'p-4 bg-white/5 rounded-full mb-1' : 'shrink-0 mt-0.5'}>
            {icons[toast.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.title && <h3 className={`text-white font-medium ${isModal ? 'text-lg mb-2' : 'text-sm mb-1'}`}>{toast.title}</h3>}
          <p className={`text-zinc-400 ${isModal ? 'text-base' : 'text-sm'} leading-relaxed break-words`}>{toast.message}</p>
        </div>

        {/* Close button for notifications */}
        {!isModal && toast.type !== 'confirm' && (
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-white transition-colors p-0.5 -mr-1"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Buttons for Confirm Dialog */}
      {toast.type === 'confirm' && (
        <div className={`flex gap-3 mt-6 ${isModal ? 'w-full' : 'justify-end'}`}>
          <button
            onClick={handleCancel}
            className={`flex-1 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/10 bg-white/5 rounded-xl transition-colors border border-white/5 font-medium`}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg shadow-blue-900/20 font-medium`}
          >
            确认
          </button>
        </div>
      )}
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToastStore();
  
  const notifications = toasts.filter(t => t.type !== 'confirm');
  const dialogs = toasts.filter(t => t.type === 'confirm');

  return (
    <>
        {/* Notifications Layer */}
        <div className="fixed top-6 right-6 z-[10000] flex flex-col gap-3 pointer-events-none">
            {notifications.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>

        {/* Modals Layer */}
        {dialogs.map((toast) => (
            <div key={toast.id} className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <ToastItem toast={toast} isModal={true} />
            </div>
        ))}
    </>
  );
};
