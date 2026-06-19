"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, User, Mail, Lock, Sparkles, AlertCircle, Swords, Shield 
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);

  // Email/Password Form States
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user is already authenticated, redirect them straight to profile
    let unsubscribeAuth = () => {};
    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          router.replace("/profile");
        } else {
          setAuthLoading(false);
        }
      });
    } else {
      setAuthLoading(false);
    }
    return () => unsubscribeAuth();
  }, [router]);

  const handleGoogleSignIn = async () => {
    if (!auth) {
      alert("Firebase configuration not detected. Please verify your environment variables.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Update local profile info from Google Account Info
      const savedProfile = localStorage.getItem("tt_profile_info");
      let profile = savedProfile ? JSON.parse(savedProfile) : { displayName: "", email: "", discord: "" };
      profile.displayName = user.displayName || profile.displayName || "Epic Adventurer";
      profile.email = user.email || profile.email || "adventurer@tavern.local";
      localStorage.setItem("tt_profile_info", JSON.stringify(profile));
      
      router.push("/profile");
    } catch (err) {
      console.error("Google Sign-In failed:", err);
      alert("Sign-In failed. Make sure Google Sign-in is enabled in your Firebase Console and localhost/domain is authorized.");
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    if (!auth) {
      setAuthError("Firebase Auth is not configured.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (authMode === "register") {
        if (authPassword !== authConfirmPassword) {
          setAuthError("Passwords do not match.");
          setIsSubmitting(false);
          return;
        }
        if (authPassword.length < 6) {
          setAuthError("Password must be at least 6 characters.");
          setIsSubmitting(false);
          return;
        }

        const credential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        
        await updateProfile(credential.user, {
          displayName: "Epic Adventurer",
        });

        // Set default profile data
        const savedProfile = localStorage.getItem("tt_profile_info");
        let profile = savedProfile ? JSON.parse(savedProfile) : { displayName: "Epic Adventurer", email: "", discord: "" };
        profile.email = authEmail;
        localStorage.setItem("tt_profile_info", JSON.stringify(profile));
      } else {
        const credential = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        
        // Sync email to local profile
        const savedProfile = localStorage.getItem("tt_profile_info");
        let profile = savedProfile ? JSON.parse(savedProfile) : { displayName: "", email: "", discord: "" };
        profile.displayName = credential.user.displayName || profile.displayName || "Epic Adventurer";
        profile.email = credential.user.email || authEmail;
        localStorage.setItem("tt_profile_info", JSON.stringify(profile));
      }

      router.push("/profile");
    } catch (err: any) {
      console.error("Email authentication failed:", err);
      if (err.code === "auth/email-already-in-use") {
        setAuthError("This email is already in use.");
      } else if (err.code === "auth/invalid-credential") {
        setAuthError("Invalid email or password.");
      } else if (err.code === "auth/weak-password") {
        setAuthError("Password is too weak.");
      } else {
        setAuthError(err.message || "Authentication failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen w-full bg-radial from-theme-radial-start via-theme-radial-mid to-theme-radial-end flex items-center justify-center p-6 text-slate-500 text-sm font-bold uppercase tracking-wider animate-pulse">
        Checking credentials...
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-radial from-theme-radial-start via-theme-radial-mid to-theme-radial-end relative overflow-y-auto p-6 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-350 transition-colors text-sm font-bold uppercase tracking-wider"
        >
          <ChevronLeft className="w-4 h-4" />
          Home
        </button>
      </div>

      {/* Auth Card Container */}
      <div className="z-10 w-full max-w-md space-y-6 py-12">
        {/* Logo and Greeting */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl">
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl">
              <Swords className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Tavern &amp; Table</h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Join the Adventure
          </p>
        </div>

        {/* Auth Box */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-6 sm:p-8 space-y-6 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-bold text-white mb-0.5">
              {authMode === "login" ? "Account Sign In" : "Register Account"}
            </h2>
            <p className="text-slate-500 text-[10px] leading-relaxed font-semibold uppercase tracking-wider">
              {authMode === "login" ? "Welcome back, hero" : "Forge a new profile"}
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Sign-in */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-md shadow-white/5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google Login
            </button>

            <div className="flex items-center gap-3 my-2 select-none">
              <div className="flex-1 h-px bg-slate-800/60" />
              <span className="text-[9px] font-black text-slate-650 uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-slate-800/60" />
            </div>

            {/* Email/Password Sign-in */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="adventurer@domain.com"
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              {authMode === "register" && (
                <div className="space-y-1.5 animate-slide-down">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                    <input
                      type="password"
                      required
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>
              )}

              {authError && (
                <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold pl-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                  {isSubmitting ? "Processing..." : authMode === "login" ? "Log In" : "Create Account"}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setAuthError("");
                  }}
                  className="text-xs text-slate-550 hover:text-slate-350 font-bold transition-colors text-center py-1.5"
                >
                  {authMode === "login" 
                    ? "Don't have an account? Sign Up" 
                    : "Already have an account? Log In"
                  }
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
