import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Zap, FileCheck, Mail, Globe } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Trustless Verification",
    description:
      "No third parties, no central databases. Pure cryptographic proof that your documents are authentic and unmodified.",
  },
  {
    icon: Lock,
    title: "Zero-Knowledge Privacy",
    description:
      "Prove your credentials without revealing sensitive information. Only the facts employers need are disclosed.",
  },
  {
    icon: FileCheck,
    title: "DigiLocker Integration",
    description:
      "Works exclusively with government-signed PDFs from DigiLocker. Fake or tampered documents are instantly rejected.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description:
      "Verification happens in real-time through email. No waiting periods, no manual processing, no delays.",
  },
  {
    icon: Mail,
    title: "Email-Based Flow",
    description:
      "Simple workflow: receive request via email, click to verify, proof sent back automatically. No app downloads required.",
  },
  {
    icon: Globe,
    title: "Open Source",
    description:
      "Fully transparent codebase. Anyone can audit how verification works and ensure there are no backdoors.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Decorative lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container px-4 md:px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Rethinking verification from the ground up
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every aspect designed for privacy, security, and simplicity. No
            compromises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border/50 hover:border-border transition-colors group"
            >
              <CardContent className="pt-6">
                <div className="mb-4">
                  <feature.icon className="h-8 w-8 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
