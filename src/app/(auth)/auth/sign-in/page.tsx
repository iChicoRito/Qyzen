import { LoginForm1 } from "./components/sign-in-form"
import Link from "next/link"

// Page - sign in page
export default function Page() {
  return (
    <div className="bg-dark flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          Qyzen
        </Link>
        <LoginForm1 />
      </div>
    </div>
  )
}
