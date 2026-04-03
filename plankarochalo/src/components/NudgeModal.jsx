import { useState } from 'react'
import { X } from 'lucide-react'

const NUDGES = [
  { text: 'Vote kar do warna Goa cancel 😭',       vibe: '🔥 Urgent'  },
  { text: '2 mins ka kaam hai. Trip bacha lo.',     vibe: '⚡ Quick'   },
  { text: 'Your silence is delaying beach happiness.', vibe: '🏖️ Guilt' },
  { text: 'This trip is waiting on flaky energy 👀', vibe: '👀 Shady'  },
  { text: 'One tap away from vacation happiness.',  vibe: '✨ Sweet'   },
  { text: 'The group chat is haunted by your absence.', vibe: '👻 Spooky' },
]

export default function NudgeModal({ onClose }) {
  const [copied, setCopied] = useState(null)

  function copy(text) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-t-3xl px-5 pb-8 pt-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Nudge your group 📣</h3>
            <p className="text-xs text-gray-400 mt-0.5">Copy a message and paste into WhatsApp</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-2">
          {NUDGES.map(({ text, vibe }) => (
            <button
              key={text}
              onClick={() => copy(text)}
              className="w-full text-left p-3.5 rounded-2xl bg-gray-50 hover:bg-violet-50 active:bg-violet-100 transition-colors border border-transparent hover:border-violet-200"
            >
              <div className="text-[10px] text-violet-500 font-bold mb-1">{vibe}</div>
              <div className="text-sm text-gray-800">{text}</div>
              {copied === text && (
                <div className="text-[10px] text-green-600 font-semibold mt-1">✓ Copied to clipboard!</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
