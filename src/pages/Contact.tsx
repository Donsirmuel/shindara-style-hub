import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    toast.success('Message sent.', {
      description: 'We will get back to you shortly.',
    });

    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
    });
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Contact</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Need Help With Your Order?</h1>
          <p className="mt-2 text-sm text-foreground/75 sm:text-base">
            Send us a message and we will reply as quickly as possible.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-4">
            <Card className="border-border/80">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-md bg-secondary p-2.5">
                  <Phone className="h-5 w-5 text-foreground/80" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Phone</h2>
                  <p className="mt-1 text-sm font-medium">+234 800 000 0000</p>
                  <p className="text-sm text-muted-foreground">Mon - Sat, 9am - 6pm</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-md bg-secondary p-2.5">
                  <Mail className="h-5 w-5 text-foreground/80" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Email</h2>
                  <p className="mt-1 text-sm font-medium">info@shindara.com</p>
                  <p className="text-sm text-muted-foreground">support@shindara.com</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-md bg-secondary p-2.5">
                  <MapPin className="h-5 w-5 text-foreground/80" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Store</h2>
                  <p className="mt-1 text-sm font-medium">Lekki Phase 1, Lagos</p>
                  <p className="text-sm text-muted-foreground">Visit us for fittings and pickups.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-border/80">
              <CardContent className="p-6 sm:p-7">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        required
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={formData.phone}
                      onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      required
                      rows={6}
                      placeholder="Tell us what you need help with."
                      value={formData.message}
                      onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                    />
                  </div>

                  <Button type="submit" size="lg" className="h-11 w-full rounded-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
