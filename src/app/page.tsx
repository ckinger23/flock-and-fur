import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Flock & Fur
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Professional Animal Cleanup
            <br />
            <span className="text-primary/70">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with trusted cleaners for your cages, pens, barns, and more.
            Serving Birmingham, Alabama and surrounding areas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=client">
              <Button size="lg" className="text-lg px-8">
                I Need Cleaning
              </Button>
            </Link>
            <Link href="/register?role=cleaner">
              <Button size="lg" variant="outline" className="text-lg px-8">
                I Want to Clean
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* For Clients */}
            <div>
              <h3 className="text-xl font-semibold mb-6 text-center">
                For Animal Owners
              </h3>
              <div className="space-y-6">
                <Step
                  number={1}
                  title="Post Your Job"
                  description="Describe your cleanup needs, location, and preferred dates."
                />
                <Step
                  number={2}
                  title="Review Applications"
                  description="Browse cleaner profiles and select the best fit for your needs."
                />
                <Step
                  number={3}
                  title="Confirm & Pay"
                  description="Review completion photos and release payment securely."
                />
              </div>
            </div>

            {/* For Cleaners */}
            <div>
              <h3 className="text-xl font-semibold mb-6 text-center">
                For Cleaners
              </h3>
              <div className="space-y-6">
                <Step
                  number={1}
                  title="Create Your Profile"
                  description="Showcase your experience and set your service areas."
                />
                <Step
                  number={2}
                  title="Browse Jobs"
                  description="Find cleanup jobs that match your skills and schedule."
                />
                <Step
                  number={3}
                  title="Complete & Get Paid"
                  description="Finish the job, upload photos, and receive payment."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Flock & Fur?
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              title="Verified Cleaners"
              description="All cleaners share their background and experience with animals."
            />
            <FeatureCard
              title="Secure Payments"
              description="Pay safely through our platform. Funds released after job confirmation."
            />
            <FeatureCard
              title="Photo Verification"
              description="Cleaners upload before/after photos to verify completed work."
            />
            <FeatureCard
              title="Ratings & Reviews"
              description="Two-way rating system builds trust in the community."
            />
          </div>
        </div>
      </section>

      {/* Animal Types */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">All Animals Welcome</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            From small cages to large barns, we connect you with cleaners
            experienced in all types of animal care.
          </p>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {[
              "Dogs",
              "Cats",
              "Birds",
              "Horses",
              "Goats",
              "Chickens",
              "Pigs",
              "Cows",
              "Rabbits",
              "And More",
            ].map((animal) => (
              <span
                key={animal}
                className="px-4 py-2 bg-background rounded-full border text-sm"
              >
                {animal}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join the Flock & Fur community today. Whether you need cleaning
            services or want to offer them, we&apos;ve got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=client">
              <Button size="lg">Find a Cleaner</Button>
            </Link>
            <Link href="/register?role=cleaner">
              <Button size="lg" variant="outline">
                Become a Cleaner
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="font-semibold">Flock & Fur</p>
              <p className="text-sm text-muted-foreground">
                Birmingham, Alabama
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} Flock & Fur. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
