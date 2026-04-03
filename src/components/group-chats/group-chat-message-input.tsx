'use client'

import { type FormEvent, useState } from 'react'
import { IconLoader2 as Loader2, IconSendFilled } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface GroupChatMessageInputProps {
  disabled?: boolean
  isSending?: boolean
  placeholder?: string
  onSendMessage: (content: string) => Promise<void>
}

// GroupChatMessageInput - render one text-only message composer
export function GroupChatMessageInput({
  disabled = false,
  isSending = false,
  placeholder = 'Message this group chat...',
  onSendMessage,
}: GroupChatMessageInputProps) {
  const [message, setMessage] = useState('')

  // handleSubmit - send one trimmed message and clear the field on success
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = message.trim()

    if (!trimmedMessage || disabled || isSending) {
      return
    }

    await onSendMessage(trimmedMessage)
    setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0 border-t px-4 py-3">
      <div className="flex items-center gap-2">
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={placeholder}
          disabled={disabled || isSending}
        />

        <Button type="submit" size="icon" disabled={disabled || isSending || !message.trim()}>
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <IconSendFilled size={18} />}
        </Button>
      </div>
    </form>
  )
}
