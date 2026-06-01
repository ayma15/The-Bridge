import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import AIAssistant from './AIAssistant'

export default function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-primary-600 dark:bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center justify-center z-40"
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
      <AIAssistant isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

