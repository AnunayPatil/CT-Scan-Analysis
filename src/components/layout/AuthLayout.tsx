import { Outlet, Link } from "react-router-dom";
import { Brain } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur">
              <Brain className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold">NeuroScan AI</span>
              <span className="text-xs opacity-80">Brain Stroke Detection Platform</span>
            </div>
          </Link>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              AI-Powered CT Scan Analysis for Rapid Stroke Detection
            </h1>
            <p className="text-lg opacity-90">
              Utilizing our advanced CNN-GA-BiLSTM hybrid model with 96.15% accuracy 
              to assist radiologists in detecting brain strokes from CT images.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold">96.15%</div>
                <div className="text-sm opacity-80">Model Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold">&lt;3s</div>
                <div className="text-sm opacity-80">Analysis Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold">Grad-CAM</div>
                <div className="text-sm opacity-80">XAI Visualization</div>
              </div>
            </div>
          </div>

          <div className="text-sm opacity-60">
            © 2025 NeuroScan AI. For research and clinical decision support only.
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">NeuroScan AI</span>
            </div>
            
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

