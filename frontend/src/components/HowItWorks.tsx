import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Upload,
  Cpu,
  Shield,
  CheckCircle,
  ArrowDown,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Mail,
    title: "Email Request",
    description:
      "Employer sends verification request via email. No third-party agencies involved.",
  },
  {
    number: "02",
    icon: Upload,
    title: "Upload Document",
    description:
      "You receive the email and upload your DigiLocker certificate. Everything stays local in your browser.",
  },
  {
    number: "03",
    icon: Cpu,
    title: "WebAssembly Processing",
    description:
      "Our system uses zk-pdf to parse PDF bytes and validate the government's digital signature.",
  },
  {
    number: "04",
    icon: Shield,
    title: "SNARK Proof Generation",
    description:
      "Zero-knowledge proof is generated, confirming document authenticity without revealing content.",
  },
  {
    number: "05",
    icon: CheckCircle,
    title: "Instant Verification",
    description:
      "Cryptographic proof emailed back to employer. Mathematically certain, no trust required.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            How it works
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Five steps to trustless verification
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            State-of-the-art cryptography made simple. The entire process
            happens through email with mathematical certainty.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex-shrink-0 relative">
                    <div className="w-16 h-16 rounded-full border-2 border-border bg-background flex items-center justify-center group hover:border-foreground transition-colors">
                      <step.icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-mono">
                      {step.number}
                    </div>
                  </div>

                  <Card className="flex-1 border-border/50">
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex justify-center mt-6 mb-2">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
