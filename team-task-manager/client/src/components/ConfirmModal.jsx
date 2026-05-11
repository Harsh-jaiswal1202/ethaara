import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * A modern, premium confirmation modal.
 * 
 * @param {boolean} isOpen - Whether the modal is visible.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message body.
 * @param {string} confirmText - Text for the confirmation button.
 * @param {string} cancelText - Text for the cancel button.
 * @param {function} onConfirm - Callback when confirmed.
 * @param {function} onCancel - Callback when cancelled.
 * @param {boolean} isDanger - Whether the action is destructive (red theme).
 * @param {boolean} isLoading - Whether the action is currently processing.
 */
const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel, 
  isDanger = true,
  isLoading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with premium blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={!isLoading ? onCancel : undefined}
      />
      
      {/* Modal Container */}
      <div className="relative glass-card w-full max-auto max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Top accent bar for danger actions */}
        {isDanger && <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>}
        
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${isDanger ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'}`}>
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            
            <button 
              onClick={onCancel}
              disabled={isLoading}
              className="text-muted hover:text-main transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-black text-main mb-2 tracking-tight">{title}</h3>
            <p className="text-muted leading-relaxed">
              {message}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="btn-secondary min-h-[44px] sm:min-w-[100px] order-2 sm:order-1"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`min-h-[44px] sm:min-w-[120px] font-bold rounded-lg px-4 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 order-1 sm:order-2 ${
                isDanger 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30' 
                  : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              } disabled:opacity-60 disabled:active:scale-100`}
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
