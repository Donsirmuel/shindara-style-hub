import { Link } from 'react-router-dom';
import { site } from '@/site.config';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/70 bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-[0.9rem] font-semibold tracking-[0.14em]">{site.brand.toUpperCase()}</h3>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              {site.description}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/women" className="text-foreground/85 transition-colors hover:text-foreground">
                  Women
                </Link>
              </li>
              <li>
                <Link to="/men" className="text-foreground/85 transition-colors hover:text-foreground">
                  Men
                </Link>
              </li>
              <li>
                <Link to="/bulk" className="text-foreground/85 transition-colors hover:text-foreground">
                  Bulk & Wholesale
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-foreground/85 transition-colors hover:text-foreground">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/#fresh-picks" className="text-foreground/85 transition-colors hover:text-foreground">
                  New In
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contact</h4>
            <p className="text-sm text-foreground/85">{site.contact.email}</p>
            <p className="text-sm text-foreground/85">{site.contact.phone}</p>
            <p className="text-sm text-muted-foreground">{site.pickup.enabled ? `Pickup: ${site.pickup.address}` : site.contact.address}</p>
            <Link to="/contact" className="text-sm font-semibold text-foreground/85 transition-colors hover:text-foreground">
              Contact page
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-border/70 pt-5 text-center text-xs text-muted-foreground">
          &copy; {currentYear} {site.brand}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
