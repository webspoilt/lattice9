import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0b] mesh-background">
      <div className="l9-card w-full max-w-lg mx-4 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-none animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-indigo-500" />
            </div>
          </div>

          <div className="telemetry-text text-indigo-500 mb-2">ERROR_CODE::404</div>
          <h1 className="display-sm text-[#e0e0e0] mb-4">SEGMENT_NOT_FOUND</h1>

          <p className="telemetry-text text-[#666] mb-8 leading-relaxed lowercase">
            The requested tactical coordinate does not exist within the current Lattice9 state space.
            <br />
            It may have been purged or re-indexed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
            <Button
              onClick={handleGoHome}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-none transition-all duration-200 font-mono text-xs tracking-widest uppercase"
            >
              <Home className="w-4 h-4 mr-2" />
              RETURN_TO_BASE
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
