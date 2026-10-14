import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { site } from '@/site.config';
import { ApiError } from '@/lib/api';

/**
 * Vendor sign-in. Reached through a private link (/login) — there is no
 * public signup: shoppers stay guests (cart + order tracking need no account).
 */
export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Deep-link return: /admin sends logged-out vendors to /login?next=/admin.
  const next = searchParams.get('next')?.startsWith('/') ? searchParams.get('next') as string : null;
  const { user, login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl border border-border/80 bg-card px-8 py-10 text-center">
          <h1 className="text-2xl font-bold">You're signed in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.role === 'admin' ? 'Manage the store from the admin dashboard.' : `Signed in as ${user.phone ?? user.email ?? 'staff'}.`}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {user.role === 'admin' && (
              <Button onClick={() => navigate(next ?? '/admin')}>Open Admin</Button>
            )}
            <Button variant={user.role === 'admin' ? 'outline' : 'default'} onClick={() => navigate(next && user.role !== 'admin' ? next : '/')}>
              {user.role === 'admin' ? 'View Store' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await login.mutateAsync({ identifier, password });
      if (!result) {
        toast.info('Demo mode', { description: 'No backend connected.' });
        navigate('/');
        return;
      }
      toast.success(`Welcome back to ${site.shortName}!`);
      navigate(next ?? (result.role === 'admin' ? '/admin' : '/'));
    } catch (e) {
      const code = e instanceof ApiError && typeof e.payload === 'object' && e.payload && 'error' in e.payload
        ? String((e.payload as { error: string }).error)
        : '';
      toast.error(code === 'invalid_credentials' ? 'Wrong login details. Try again.' : 'Could not reach the server. Try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">{site.shortName} Vendor Login</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Staff access only. Shoppers don't need an account.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="login-id">Email or phone</Label>
              <Input id="login-id" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or 080..." />
            </div>
            <div>
              <Label htmlFor="login-pass">Password</Label>
              <Input id="login-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="h-11 w-full rounded-full" disabled={login.isPending}>
              {login.isPending ? 'Please wait…' : 'Sign In'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/" className="underline">Back to store</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
