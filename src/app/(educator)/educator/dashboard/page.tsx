import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Page - educator dashboard test page
export default function Page() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Educator Dashboard</h1>
        <p className="text-muted-foreground">This page is used to test educator redirection.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Access</CardTitle>
            <CardDescription>Only educator accounts should reach this route.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500">
              Educator
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Redirection Test</CardTitle>
            <CardDescription>Sign in should send educator users here automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Route protection is active for unauthorized users.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
