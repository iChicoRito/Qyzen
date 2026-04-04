'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconLoader2 as Loader2 } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { createClient } from '@/lib/supabase/client'
import { type ResetPasswordSchema, resetPasswordSchema } from '@/lib/validations/reset-password.schema'

interface SupabaseAuthError {
  message?: string
}

// getAuthErrorMessage - normalize supabase auth errors
function getAuthErrorMessage(error: SupabaseAuthError | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// ResetPasswordForm - manage the new password step after a recovery link
export function ResetPasswordForm({ className, ...props }: React.ComponentProps<'div'>) {
  // ==================== HOOKS ====================
  const supabase = createClient()
  const [isReady, setIsReady] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // detectRecoverySession - wait for the Supabase link to establish a session
  useEffect(() => {
    let isMounted = true

    const initializeRecoverySession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (isMounted) {
          setIsReady(!error)
          setIsCheckingSession(false)
        }
        return
      }

      const { data } = await supabase.auth.getSession()

      if (isMounted) {
        setIsReady(Boolean(data.session))
        setIsCheckingSession(false)
      }
    }

    initializeRecoverySession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsReady(true)
        setIsCheckingSession(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // handleSubmit - update the password after recovery
  const handleSubmit = async (values: ResetPasswordSchema) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (error) {
        throw error
      }

      await supabase.auth.signOut()
      toast.success('Password updated successfully.')
      window.location.assign('/auth/sign-in')
    } catch (error) {
      const message = getAuthErrorMessage(
        error instanceof Error ? error : null,
        'We could not update your password.'
      )

      form.setError('password', {
        type: 'manual',
        message,
      })
      toast.error(message)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <Card>
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-lg">Reset your password</CardTitle>
          <CardDescription className="text-sm">
            {isCheckingSession
              ? 'Opening your recovery session...'
              : isReady
              ? 'Enter your new password below to complete the reset.'
              : 'Open the reset link from your email to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isReady ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="text-left">
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter a new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="text-left">
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-muted-foreground text-center text-sm">
              After you open the link from your email, this page will let you set a new password.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
