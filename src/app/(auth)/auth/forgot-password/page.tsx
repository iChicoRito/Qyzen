import Image from 'next/image'
import Link from 'next/link'

import { ForgotPasswordForm } from './components/forgot-password-form'

import logoDark from '../../../../../public/logo-dark.png'
import logoLight from '../../../../../public/logo-light.png'

// ForgotPasswordPage - render the auth recovery page
export default function ForgotPasswordPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center">
      <div className="flex w-full max-w-md flex-col">
        <Link href="/auth/sign-in" className="-mb-3 flex items-center self-center font-medium">
          <Image
            src={logoDark}
            alt="Qyzen logo"
            width={100}
            height={100}
            priority
            className="block dark:hidden"
          />
          <Image
            src={logoLight}
            alt="Qyzen logo"
            width={100}
            height={100}
            priority
            className="hidden dark:block"
          />
        </Link>
        <p className="text-muted-foreground mb-4 text-center text-xs mt-0">
          Recover your Qyzen account with a 6-digit email code.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
