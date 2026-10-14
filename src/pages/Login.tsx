import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { site } from '@/site.config';
import { ApiError } from '@/lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [accountType, setAccountType] = useState<'retail' | 'wholesaler'>('retail');

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl border border-border/80 bg-card px-8 py-10 text-center">
          <h1 className="text-2xl font-bold">You're signed in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.role === 'admin' ? 'Manage the store from the admin dashboard.' : `Shopping as ${user.phone ?? user.email ?? 'customer'}.`}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {user.role === 'admin' && (
              <Button onClick={() => navigate('/admin')}>Open Admin</Button>
            )}
            <Button variant={user.role === 'admin' ? 'outline' : 'default'} onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const friendlyError = (e: unknown) => {
    if (e instanceof ApiError) {
      const code = typeof e.payload === 'object' && e.payload && 'error' in e.payload
        ? String((e.payload as { error: string }).error)
        : '';
      if (code === 'account_exists') return 'An account with those details already exists. Try signing in.';
      if (code === 'invalid_credentials') return 'Wrong login details. Try again.';
      return code.replace(/_/g, ' ') || 'Something went wrong.';
    }
    return 'Could not reach the server. Try again.';
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await login.mutateAsync({ identifier, password });
      if (!result) {
        toast.info('Demo mode', { description: 'No backend connected — browsing as guest.' });
        navigate('/');
        return;
      }
      toast.success('Welcome back!');
      navigate(result.role === 'admin' ? '/admin' : '/');
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = identifier.trim();
    try {
      const result = await register.mutateAsync({
        ...(id.includes('@') ? { email: id } : { phone: id }),
        password,
        role: accountType,
        businessName: accountType === 'wholesaler' ? businessName || undefined : undefined,
      });
      if (!result) {
        toast.info('Demo mode', { description: 'No backend connected — browsing as guest.' });
        navigate('/');
        return;
      }
      if (accountType === 'wholesaler' && !result.approved) {
        toast.success('Request received', { description: 'We approve wholesale accounts within a day. You can shop retail meanwhile.' });
      } else {
        toast.success(`Welcome to ${site.brand}!`);
      }
      navigate('/');
    } catch (e) {
      toast.error(friendlyError(e));
    }
  };

  const busy = login.isPending || register.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <CardTitle className="text-2xl">{mode === 'login' ? 'Sign In' : 'Create Account'}</CardTitle>
          <div className="mt-3 flex rounded-full bg-secondary p-1 text-sm">
            <button
              type="button"
              className={`flex-1 rounded-full py-1.5 font-semibold ${mode === 'login' ? 'bg-card shadow' : 'text-muted-foreground'}`}
              onClick={() => setMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full py-1.5 font-semibold ${mode === 'register' ? 'bg-card shadow' : 'text-muted-foreground'}`}
              onClick={() => setMode('register')}
            >
              Create account
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-id">Email or phone</Label>
                <Input id="login-id" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or 080..." />
              </div>
              <div>
                <Label htmlFor="login-pass">Password</Label>
                <Input id="login-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="h-11 w-full rounded-full" disabled={busy}>
                {busy ? 'Please wait…' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label>Account type</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(['retail', 'wholesaler'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAccountType(t)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize ${accountType === t ? 'border-accent bg-accent/15' : 'border-border/80 text-muted-foreground'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {accountType === 'wholesaler' && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Wholesale unlocks bulk pricing (12+ pcs). Approval usually takes a day.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="reg-id">Email or phone</Label>
                <Input id="reg-id" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or 080..." />
              </div>
              {accountType === 'wholesaler' && (
                <div>
                  <Label htmlFor="reg-biz">Business name</Label>
                  <Input id="reg-biz" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ada Traders" />
                </div>
              )}
              <div>
                <Label htmlFor="reg-pass">Password (8+ characters)</Label>
                <Input id="reg-pass" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="h-11 w-full rounded-full" disabled={busy}>
                {busy ? 'Please wait…' : accountType === 'wholesaler' ? 'Request Wholesale Account' : 'Create Account'}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/" className="underline">Continue as guest</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
