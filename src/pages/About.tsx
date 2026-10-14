import { site } from '@/site.config';

export default function About() {
  return (
    <div className="min-h-screen py-16 animate-fade-in">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">About {site.shortName}</h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <div className="text-center text-muted-foreground text-xl mb-12">
            {site.about.tagline}
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Story</h2>
            {site.about.story.map((paragraph, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              {site.about.missionIntro}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              {site.about.mission.map((item) => (
                <li key={item} className="flex items-start">
                  <span className="mr-2 text-accent">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Why Choose {site.shortName}?</h2>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {site.about.values.map((value) => (
                <div key={value.heading} className="p-6 rounded-lg bg-secondary/30">
                  <h3 className="text-lg font-semibold mb-2">{value.heading}</h3>
                  <p className="text-sm text-muted-foreground">
                    {value.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 pt-8">
            <h2 className="text-2xl font-semibold">Visit Our Store</h2>
            <p className="text-muted-foreground leading-relaxed">
              {site.about.visit}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
