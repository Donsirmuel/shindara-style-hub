import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card mt-auto animate-fade-in">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight">SHINDARA</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fashion Brand that sells male and female fashion wears and items.
              Affordable luxury for everyone.
            </p>
            <div className="flex space-x-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all hover-lift"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all hover-lift"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all hover-lift"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all hover-lift"
                aria-label="Youtube"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all hover-lift"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Discover */}
          <div className="space-y-4">
            <h4 className="font-semibold">Discover</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/women" className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Women's Fashion</span>
                </Link>
              </li>
              <li>
                <Link to="/men" className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Men's Fashion</span>
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">New Arrivals</span>
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Trending</span>
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Hot Deals</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="font-semibold">Customer Service</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">About Us</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Contact Us</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Privacy Policy</span>
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Shipping & Returns</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors inline-flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Terms & Conditions</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold">Get In Touch</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <span className="block font-medium text-foreground mb-1">Email:</span>
                info@shindara.com
              </li>
              <li>
                <span className="block font-medium text-foreground mb-1">Phone:</span>
                +234 800 000 0000
              </li>
              <li>
                <span className="block font-medium text-foreground mb-1">Address:</span>
                123 Fashion Street<br />
                Lekki Phase 1<br />
                Lagos, Nigeria
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Shindara Fashion World. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
