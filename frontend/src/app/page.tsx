import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <Features />
        <HowItWorks />
      </main>
    </div>
  );
}
