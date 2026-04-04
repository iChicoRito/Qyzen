import Image from 'next/image'
import Link from 'next/link'

import { ResetPasswordForm } from './components/reset-password-form'

import logoDark from '../../../../../public/logo-dark.png'
import logoLight from '../../../../../public/logo-light.png'

// ResetPasswordPage - render the recovery password page
export default function ResetPasswordPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-4">
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
        <p className="text-muted-foreground mb-4 text-center text-xs">
          Create a new password for your Qyzen account.
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
