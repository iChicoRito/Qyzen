import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Page - student dashboard test page
export default function Page() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">This page is used to test student redirection.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Access</CardTitle>
            <CardDescription>Only student accounts should reach this route.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500">
              Student
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Redirection Test</CardTitle>
            <CardDescription>Sign in should send student users here automatically.</CardDescription>
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
