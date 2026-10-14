/**
 * ONE FILE PER CLIENT — fork the repo, edit this, redeploy.
 * Nothing else needs code changes for a standard boutique/wholesaler.
 */
export const site = {
  brand: "Shindara Fashion World",
  tagline: "Affordable Nigerian Fashion Store",
  description:
    "Shop premium Nigerian fashion at affordable prices. Contemporary and traditional designs for men and women.",
  logo: "/favicon.svg",
  currency: "NGN",
  locale: "en-NG",
  contact: {
    phone: "+234 800 000 0000",
    whatsapp: "2348000000000",
    email: "hello@shindara.example",
    address: "Lagos, Nigeria",
    mapUrl: "",
  },
  socials: { instagram: "", tiktok: "", facebook: "" },
  theme: { primary: "#7c2d12", fontHeading: "Poppins" },
  features: { bulk: true, retail: true, wholesalerApproval: true },
  shipping: { baseFee: 2000, freeAbove: 100000 },
  pickup: {
    enabled: true,
    label: 'Store pickup (free)',
    address: '14 Allen Avenue, Ikeja, Lagos — open Mon–Sat, 9am–6pm',
  },
  bulk: { defaultMOQ: 12, tiersLabel: "Buy more, save more" },
  inventory: {
    /** Variants at or below this stock count raise a "low stock" alert. */
    lowStockAt: 5,
  },
} as const;

export type SiteConfig = typeof site;
