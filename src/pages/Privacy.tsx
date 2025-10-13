export default function Privacy() {
  return (
    <div className="min-h-screen py-16 animate-fade-in">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none space-y-8 text-muted-foreground">
          <p className="text-center text-lg mb-12">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
            <p className="leading-relaxed">
              At Shindara Fashion World, we collect information that you provide directly to us when you:
            </p>
            <ul className="space-y-2 ml-6">
              <li>Create an account or make a purchase</li>
              <li>Subscribe to our newsletter</li>
              <li>Contact our customer service team</li>
              <li>Participate in surveys or promotions</li>
            </ul>
            <p className="leading-relaxed">
              This may include your name, email address, phone number, shipping address, payment information,
              and purchase history.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="space-y-2 ml-6">
              <li>Process and fulfill your orders</li>
              <li>Send you order confirmations and shipping updates</li>
              <li>Respond to your customer service requests</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Improve our website and shopping experience</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Information Sharing</h2>
            <p className="leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share your
              information with:
            </p>
            <ul className="space-y-2 ml-6">
              <li>Service providers who assist in our operations (payment processors, shipping companies)</li>
              <li>Law enforcement when required by law</li>
              <li>Business partners with your explicit consent</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction. However, no method of
              transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Your Rights</h2>
            <p className="leading-relaxed">
              You have the right to:
            </p>
            <ul className="space-y-2 ml-6">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Object to processing of your personal information</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Cookies</h2>
            <p className="leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our website and store certain
              information. You can instruct your browser to refuse all cookies or to indicate when a cookie is
              being sent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Children's Privacy</h2>
            <p className="leading-relaxed">
              Our service is not directed to children under 13. We do not knowingly collect personal information
              from children under 13. If you become aware that a child has provided us with personal information,
              please contact us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="space-y-2 ml-6">
              <li>Email: privacy@shindara.com</li>
              <li>Phone: +234 800 000 0000</li>
              <li>Address: 123 Fashion Street, Lekki Phase 1, Lagos, Nigeria</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}