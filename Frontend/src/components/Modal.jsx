import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <AnimatePresence>
      {open && (
        <div className="modal-backdrop" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className={`w-full ${sizes[size]} bg-dark-800 dark:bg-dark-800 light:bg-white border border-dark-500 dark:border-dark-500 light:border-slate-200 rounded-2xl shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600 dark:border-dark-600 light:border-slate-100">
              <h2 className="font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900" style={{fontFamily:'Syne,sans-serif'}}>{title}</h2>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-dark-600 transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
