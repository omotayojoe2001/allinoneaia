import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Eye, EyeOff, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    referralCode: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-lg">NexusAI</span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Welcome back to <span className="text-primary">NexusAI</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Pick up right where you left off. Your chatbots, automations, content, and analytics are waiting for you.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 NexusAI. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg">NexusAI</span>
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold text-foreground mb-1">Log in to your account</h1>
            <p className="text-sm text-muted-foreground mb-8">Enter your credentials to access your workspace.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email address</label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Referral code */}
              {!showReferral ? (
                <button
                  type="button"
                  onClick={() => setShowReferral(true)}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Gift className="w-4 h-4" />
                  Have a referral code?
                </button>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Referral code</label>
                  <Input
                    placeholder="Enter referral code"
                    value={form.referralCode}
                    onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" size="lg">
                Log In <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-6 text-center">
              By logging in, you agree to our{" "}
              <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
