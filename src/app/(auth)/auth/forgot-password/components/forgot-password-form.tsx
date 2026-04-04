'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconLoader2 as Loader2 } from '@tabler/icons-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  type ForgotPasswordEmailSchema,
  forgotPasswordEmailSchema,
} from '@/lib/validations/forgot-password.schema'

interface SupabaseAuthError {
  message?: string
}

// getAuthErrorMessage - normalize supabase auth errors
function getAuthErrorMessage(error: SupabaseAuthError | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// ForgotPasswordForm - manage the password recovery email request
export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<'div'>) {
  // ==================== HOOKS ====================
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)

  const emailForm = useForm<ForgotPasswordEmailSchema>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: {
      email: '',
    },
  })

  // handleSendCode - send the password recovery email to an existing account
  const handleSendCode = async (values: ForgotPasswordEmailSchema) => {
    setIsSending(true)

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email.trim(),
        }),
      })

      const payload = (await response.json()) as { email?: string; message?: string }

      if (!response.ok) {
        throw new Error(payload.message || 'We could not send a recovery email for that address.')
      }

      router.push(
        `/auth/forgot-password/fallback?status=success&email=${encodeURIComponent(
          payload.email || values.email.trim()
        )}`
      )
    } catch (error) {
      const message = getAuthErrorMessage(
        error instanceof Error ? error : null,
        'We could not send a recovery email for that address.'
      )

      router.push(
        `/auth/forgot-password/fallback?status=failed&message=${encodeURIComponent(message)}`
      )
    } finally {
      setIsSending(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <Card>
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-lg">Forgot your password?</CardTitle>
          <CardDescription className="text-sm">
            Enter your email address and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleSendCode)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="text-left">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
          </Form>

          <div className="text-muted-foreground text-center text-xs">
            <Link href="/auth/sign-in" className="underline underline-offset-4">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
