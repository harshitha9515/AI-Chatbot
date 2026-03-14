import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Sparkles, ArrowRight } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

const AuthPage = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We sent you a verification link." });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        toast({ title: "Check your email", description: "Password reset link sent." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 glow-primary">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-gradient">Harshi AI</span>
            </div>
            <p className="text-muted-foreground text-sm">
              {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
            </p>
          </div>

          {/* Google Sign-In */}
          {mode !== "forgot" && (
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full h-12 gap-3 border-border hover:bg-secondary/60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">or</span></div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form key={mode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 bg-secondary/50 border-glass-border focus:border-primary/50 h-12" />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 bg-secondary/50 border-glass-border focus:border-primary/50 h-12" />
              </div>
              {mode !== "forgot" && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10 bg-secondary/50 border-glass-border focus:border-primary/50 h-12" />
                </div>
              )}
              <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold glow-primary">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-6 space-y-2 text-center text-sm">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary transition-colors block w-full">Forgot password?</button>
                <button onClick={() => setMode("signup")} className="text-muted-foreground hover:text-primary transition-colors block w-full">Don't have an account? <span className="text-primary font-medium">Sign up</span></button>
              </>
            )}
            {mode === "signup" && (
              <button onClick={() => setMode("login")} className="text-muted-foreground hover:text-primary transition-colors">Already have an account? <span className="text-primary font-medium">Sign in</span></button>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="text-muted-foreground hover:text-primary transition-colors">Back to <span className="text-primary font-medium">Sign in</span></button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
