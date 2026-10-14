/**
 * ONE FILE PER CLIENT — fork the repo, edit this, redeploy.
 * Nothing else needs code changes for a standard boutique/wholesaler.
 */
export const site = {
  brand: "Shindara Fashion World",
  shortName: "Shindara",
  /** URL-safe slug. Namespaces the cart key, cookies and order refs per fork. */
  brandSlug: "shindara",
  tagline: "Affordable Nigerian Fashion Store",
  description:
    "Shop premium Nigerian fashion at affordable prices. Explore our collection of contemporary and traditional designs for men and women. Quality fashion that doesn't break the bank.",
  about: {
    tagline: "Fashion Brand that sells male and female fashion wears and items",
    story: [
      "Shindara Fashion World was founded with a simple yet powerful vision: to make quality fashion accessible to everyone. We believe that style shouldn't come with an exorbitant price tag, and that everyone deserves to look and feel their best.",
      "Based in Nigeria, we celebrate both contemporary and traditional African fashion, bringing together the best of modern design with the rich heritage of our culture. Our collections feature everything from elegant Ankara prints to sophisticated business wear, all carefully curated to meet the diverse needs of our customers.",
    ],
    missionIntro: "At Shindara, we're committed to:",
    mission: [
      "Providing affordable, high-quality fashion for men and women",
      "Celebrating African culture through contemporary designs",
      "Offering exceptional customer service and shopping experience",
      "Supporting local artisans and sustainable fashion practices",
    ],
    values: [
      { heading: "Quality Materials", text: "We source premium fabrics and materials to ensure durability and comfort in every piece." },
      { heading: "Affordable Prices", text: "Luxury shouldn't break the bank. We offer competitive prices without compromising quality." },
      { heading: "Diverse Collection", text: "From traditional to contemporary, casual to formal, we have something for every occasion." },
      { heading: "Customer First", text: "Your satisfaction is our priority. We're here to help you every step of the way." },
    ],
    visit: "Experience our collections in person at our flagship store in Lagos, or shop conveniently online and have your favorites delivered to your doorstep anywhere in Nigeria.",
  },
  logo: "/favicon.svg",
  currency: "NGN",
  locale: "en-NG",
  contact: {
    phone: "+234 800 000 0000",
    hours: "Mon - Sat, 9am - 6pm",
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
