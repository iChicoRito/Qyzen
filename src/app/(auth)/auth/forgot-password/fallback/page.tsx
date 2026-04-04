 'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { IconCircleDashedCheck, IconExclamationCircle } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import logoDark from '../../../../../../public/logo-dark.png'
import logoLight from '../../../../../../public/logo-light.png'

// ForgotPasswordFallbackPage - show the success or failure state after requesting a reset email
export default function ForgotPasswordFallbackPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const email = searchParams.get('email')?.trim() || ''
  const rawMessage = searchParams.get('message')?.trim() || ''
  const isSuccess = status === 'success'
  const message =
    rawMessage ||
    (isSuccess
      ? 'We sent a password reset link to your email address.'
      : 'We could not send a reset link. Please try again.')
  const StatusIcon = isSuccess ? IconCircleDashedCheck : IconExclamationCircle

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col">
        <Link href="/auth/sign-in" className="mb-3 flex items-center self-center font-medium">
          <Image
            src={logoDark}
            alt="Qyzen logo"
            width={96}
            height={96}
            priority
            className="block dark:hidden"
          />
          <Image
            src={logoLight}
            alt="Qyzen logo"
            width={96}
            height={96}
            priority
            className="hidden dark:block"
          />
        </Link>
        <p className="text-muted-foreground mb-4 text-center text-xs">
          Recover your Qyzen account with a reset link.
        </p>
        <Card>
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center">
              <div
                className={
                  isSuccess
                    ? 'flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500'
                    : 'flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500'
                }
              >
                <StatusIcon size={32} />
              </div>
            </div>
            <CardTitle className="text-lg">
              {isSuccess ? 'Check your email' : 'Reset link failed'}
            </CardTitle>
            <CardDescription className="text-sm">{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {isSuccess ? (
              <div className="text-muted-foreground text-sm">
                {email ? (
                  <span>
                    We sent the reset link to <span className="text-foreground">{email}</span>.
                  </span>
                ) : (
                  'We sent the reset link to your inbox.'
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                Please go back and try again with the same email address.
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/auth/sign-in">{isSuccess ? 'Back to sign in' : 'Return to sign in'}</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/forgot-password">
                  {isSuccess ? 'Send another reset link' : 'Try again'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
