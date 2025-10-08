export default function About() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">About Shindara</h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <div className="text-center text-muted-foreground text-xl mb-12">
            Fashion Brand that sells male and female fashion wears and items
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed">
              Shindara Fashion World was founded with a simple yet powerful vision: to make quality
              fashion accessible to everyone. We believe that style shouldn't come with an
              exorbitant price tag, and that everyone deserves to look and feel their best.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Based in Nigeria, we celebrate both contemporary and traditional African fashion,
              bringing together the best of modern design with the rich heritage of our culture.
              Our collections feature everything from elegant Ankara prints to sophisticated
              business wear, all carefully curated to meet the diverse needs of our customers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Shindara, we're committed to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                <span>Providing affordable, high-quality fashion for men and women</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                <span>Celebrating African culture through contemporary designs</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                <span>Offering exceptional customer service and shopping experience</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                <span>Supporting local artisans and sustainable fashion practices</span>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Why Choose Shindara?</h2>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="p-6 rounded-lg bg-secondary/30">
                <h3 className="text-lg font-semibold mb-2">Quality Materials</h3>
                <p className="text-sm text-muted-foreground">
                  We source premium fabrics and materials to ensure durability and comfort in every
                  piece.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-secondary/30">
                <h3 className="text-lg font-semibold mb-2">Affordable Prices</h3>
                <p className="text-sm text-muted-foreground">
                  Luxury shouldn't break the bank. We offer competitive prices without compromising
                  quality.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-secondary/30">
                <h3 className="text-lg font-semibold mb-2">Diverse Collection</h3>
                <p className="text-sm text-muted-foreground">
                  From traditional to contemporary, casual to formal, we have something for every
                  occasion.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-secondary/30">
                <h3 className="text-lg font-semibold mb-2">Customer First</h3>
                <p className="text-sm text-muted-foreground">
                  Your satisfaction is our priority. We're here to help you every step of the way.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-8">
            <h2 className="text-2xl font-semibold">Visit Our Store</h2>
            <p className="text-muted-foreground leading-relaxed">
              Experience our collections in person at our flagship store in Lagos, or shop
              conveniently online and have your favorites delivered to your doorstep anywhere in
              Nigeria.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
