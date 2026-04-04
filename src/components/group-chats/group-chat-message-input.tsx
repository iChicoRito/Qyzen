'use client'

import { type FormEvent, useState } from 'react'
import { IconLoader2 as Loader2, IconSendFilled } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface GroupChatMessageInputProps {
  disabled?: boolean
  isSending?: boolean
  placeholder?: string
  cooldownSeconds?: number
  onSendMessage: (content: string) => Promise<void>
}

// GroupChatMessageInput - render one text-only message composer
export function GroupChatMessageInput({
  disabled = false,
  isSending = false,
  placeholder = 'Message this group chat...',
  cooldownSeconds = 0,
  onSendMessage,
}: GroupChatMessageInputProps) {
  const [message, setMessage] = useState('')
  const isCooldownActive = cooldownSeconds > 0
  const inputPlaceholder = isCooldownActive
    ? `You can send another message in ${cooldownSeconds}s`
    : placeholder

  // handleSubmit - send one trimmed message and clear the field on success
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = message.trim()

    if (!trimmedMessage || disabled || isSending || isCooldownActive) {
      return
    }

    await onSendMessage(trimmedMessage)
    setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0 border-t bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={inputPlaceholder}
          disabled={disabled || isSending || isCooldownActive}
        />

        <Button type="submit" size="icon" disabled={disabled || isSending || isCooldownActive || !message.trim()}>
          {isSending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isCooldownActive ? (
            <span className="text-sm">{cooldownSeconds}s</span>
          ) : (
            <IconSendFilled size={18} />
          )}
        </Button>
      </div>
    </form>
  )
}
