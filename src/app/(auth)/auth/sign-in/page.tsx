import { LoginForm1 } from './components/sign-in-form'
import Link from 'next/link'
import Image from 'next/image'
import logoDark from '../../../../../public/logo-dark.png'
import logoLight from '../../../../../public/logo-light.png'

// Page - sign in page
export default function Page() {
  return (
    <div className="bg-dark flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col">
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
          Qyzen - The Next Generation of Quiz App
        </p>
        <LoginForm1 />
      </div>
    </div>
  )
}
