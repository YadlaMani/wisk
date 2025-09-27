import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lock, Shield, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-50" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
          <img src="./logo.png" alt="Logo" className="h-64 w-64" />
          <div className="fade-in">
            <Badge variant="secondary" className="mb-4">
              <Shield className="w-3 h-3 mr-1" />
              Trustless Verification
            </Badge>
          </div>

          <div className="space-y-4 slide-up">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
              Background verification
              <br />
              <span className="text-muted-foreground">without the trust</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Zero-knowledge proofs meet DigiLocker. Verify credentials
              instantly while keeping your documents private. No middlemen, no
              databases, no compromises.
            </p>
          </div>

          <div
            className="flex flex-col sm:flex-row gap-4 slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Button size="lg" className="group">
              Start verification
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg">
              View demo
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-8 opacity-60">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4" />
              <span>Zero-knowledge proofs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              <span>Government-signed PDFs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4" />
              <span>Instant verification</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
