'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconBrandGithubFilled,
  IconBrandGoogleFilled,
  IconLoader2 as Loader2,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { type SignInSchema, signInSchema } from '@/lib/validations/sign-in.schema'

interface SessionResponse {
  message?: string
  dashboardPath?: string
}

// LoginForm1 - handle user sign in
export function LoginForm1({ className, ...props }: React.ComponentProps<'div'>) {
  // ==================== HOOKS ====================
  const router = useRouter()
  const supabase = createClient()
  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // handleSubmit - sign in and redirect by role
  const handleSubmit = async (values: SignInSchema) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        throw error
      }

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
      })

      const sessionData = (await response.json()) as SessionResponse

      if (!response.ok || !sessionData.dashboardPath) {
        await supabase.auth.signOut()
        throw new Error(sessionData.message || 'Failed to load your account.')
      }

      toast.success('Login successful.')
      router.replace(sessionData.dashboardPath)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in.'
      toast.error(message)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>Password</FormLabel>
                          <Link
                            href="/auth/forgot-password"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                        <FormControl>
                          <Input type="password" {...field} placeholder="Enter your password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full cursor-pointer" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>

                  <Button variant="outline" className="w-full cursor-pointer" type="button">
                    <IconBrandGoogleFilled size={18} />
                    Sign in with Google
                  </Button>
                  <Button variant="outline" className="w-full cursor-pointer" type="button">
                    <IconBrandGithubFilled size={18} />
                    Sign in with GitHub
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/sign-up" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
