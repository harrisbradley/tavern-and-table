"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, User, Mail, MessageSquare, Lock, Shield, Swords, Sparkles, Check, AlertCircle,
  Plus, Trash2, Heart, Zap, Eye, Edit3, X, Save
} from "lucide-react";
import { getCharacters, saveCharacter, deleteCharacter } from "@/lib/characterEngine";
import { Character, CLASS_DISPLAY_NAMES, RACE_DISPLAY_NAMES } from "@/types/character";
import { syncPlayerProfile, deletePlayerProfile } from "@/lib/syncEngine";
import { auth } from "@/lib/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import ThemeToggle from "@/components/ThemeToggle";

interface ProfileInfo {
  displayName: string;
  email: string;
  discord: string;
}

interface CampaignInfo {
  id: string;
  name: string;
  themeColor: string;
  synopsis?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  
  // Profile Info States
  const [profile, setProfile] = useState<ProfileInfo>({
    displayName: "",
    email: "",
    discord: "",
  });
  
  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Feedback States
  const [infoSaved, setInfoSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [hasPassword, setHasPassword] = useState(false);

  // Firebase Auth States
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Email/Password Auth Form States
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // History States
  const [dmCampaigns, setDmCampaigns] = useState<CampaignInfo[]>([]);
  const [playerCampaigns, setPlayerCampaigns] = useState<CampaignInfo[]>([]);
  const [localCharacters, setLocalCharacters] = useState<Character[]>([]);

  // Character Registry States
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState(1);
  const [editMaxHp, setEditMaxHp] = useState(10);
  const [editCurrentHp, setEditCurrentHp] = useState(10);
  const [editAc, setEditAc] = useState(10);
  const [editInitiative, setEditInitiative] = useState(0);
  const [editPassivePerception, setEditPassivePerception] = useState(10);
  const [editPublicBio, setEditPublicBio] = useState("");
  const [editPrivateBio, setEditPrivateBio] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEditing = (char: Character) => {
    setEditingCharId(char.id);
    setEditName(char.name);
    setEditLevel(char.level);
    setEditMaxHp(char.maxHp);
    setEditCurrentHp(char.currentHp);
    setEditAc(char.ac);
    setEditInitiative(char.initiative);
    setEditPassivePerception(char.passivePerception);
    setEditPublicBio(char.publicBio ?? "");
    setEditPrivateBio(char.privateBio ?? "");
  };

  const cancelEditing = () => {
    setEditingCharId(null);
  };

  const handleSaveCharacter = async (charId: string) => {
    const char = localCharacters.find(c => c.id === charId);
    if (!char) return;

    const updatedChar: Character = {
      ...char,
      name: editName.trim() || char.name,
      level: Number(editLevel),
      maxHp: Number(editMaxHp),
      currentHp: Math.min(Number(editCurrentHp), Number(editMaxHp)),
      ac: Number(editAc),
      initiative: Number(editInitiative),
      passivePerception: Number(editPassivePerception),
      publicBio: editPublicBio.trim(),
      privateBio: editPrivateBio.trim(),
    };

    saveCharacter(updatedChar);

    const updatedList = localCharacters.map(c => c.id === charId ? updatedChar : c);
    setLocalCharacters(updatedList);
    setEditingCharId(null);

    // Sync changes to any campaign where this character is currently set as active
    for (const camp of playerCampaigns) {
      const activeCharId = localStorage.getItem(`tt_campaign_char_${camp.id}`);
      if (activeCharId === charId) {
        try {
          const displayClass = `Level ${updatedChar.level} ${CLASS_DISPLAY_NAMES[updatedChar.className]}`;
          await syncPlayerProfile(camp.id, {
            id: updatedChar.id,
            name: updatedChar.name,
            className: displayClass,
            maxHp: updatedChar.maxHp,
            currentHp: updatedChar.currentHp,
            ac: updatedChar.ac,
            initiative: updatedChar.initiative,
            passivePerception: updatedChar.passivePerception,
            status: updatedChar.currentHp === 0 ? "down" : updatedChar.status,
            publicBio: updatedChar.publicBio,
            privateBio: updatedChar.privateBio,
          });
        } catch (err) {
          console.error("Failed to sync character edits to campaign:", err);
        }
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    const char = localCharacters.find(c => c.id === id);
    const charName = char ? char.name : "this character";
    const confirmation = prompt(`Are you sure you want to delete ${charName}? This cannot be undone.\n\nType 'DELETE' to confirm:`);
    if (confirmation === "DELETE") {
      deleteCharacter(id);
      playerCampaigns.forEach((camp) => {
        const activeCharId = localStorage.getItem(`tt_campaign_char_${camp.id}`);
        if (activeCharId === id) {
          localStorage.removeItem(`tt_campaign_char_${camp.id}`);
          deletePlayerProfile(camp.id, id).catch(err => console.error("Failed to delete synced player profile:", err));
        }
      });
      const updatedList = localCharacters.filter(c => c.id !== id);
      setLocalCharacters(updatedList);
    }
  };

  const handleDeleteDmCampaign = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    e.preventDefault();
    const confirmation = prompt(`Are you sure you want to delete the DM campaign "${name}"? This cannot be undone.\n\nType 'DELETE' to confirm:`);
    if (confirmation === "DELETE") {
      const updated = dmCampaigns.filter(c => c.id !== id);
      setDmCampaigns(updated);
      localStorage.setItem("tt_dm_history", JSON.stringify(updated));
    }
  };

  const handleDeletePlayerCampaign = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    e.preventDefault();
    const confirmation = prompt(`Are you sure you want to delete the Player campaign "${name}"? This cannot be undone.\n\nType 'DELETE' to confirm:`);
    if (confirmation === "DELETE") {
      const updated = playerCampaigns.filter(c => c.id !== id);
      setPlayerCampaigns(updated);
      localStorage.setItem("tt_player_history", JSON.stringify(updated));
      localStorage.removeItem(`tt_campaign_char_${id}`);
    }
  };

  useEffect(() => {
    // Load profile info
    const savedProfile = localStorage.getItem("tt_profile_info");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (err) {
        console.error("Failed to parse profile info:", err);
      }
    } else {
      // Seed default values
      setProfile({
        displayName: "Epic Adventurer",
        email: "adventurer@tavern.local",
        discord: "Adventurer#0001",
      });
    }

    // Load DM history
    const dmSaved = localStorage.getItem("tt_dm_history");
    if (dmSaved) {
      try { setDmCampaigns(JSON.parse(dmSaved)); } catch (err) { console.error(err); }
    }

    // Load Player history
    const playerSaved = localStorage.getItem("tt_player_history");
    if (playerSaved) {
      try { setPlayerCampaigns(JSON.parse(playerSaved)); } catch (err) { console.error(err); }
    }

    // Load local characters
    setLocalCharacters(getCharacters());

    // Check passcode status
    setHasPassword(!!localStorage.getItem("tt_profile_password"));

    // Check Auth Status
    let unsubscribeAuth: () => void = () => {};
    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        setAuthLoading(false);
        if (!user) {
          router.replace("/login");
        }
      });
    } else {
      setAuthLoading(false);
      router.replace("/login");
    }
    return () => {
      unsubscribeAuth();
    };
  }, []);

  const handleInfoSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tt_profile_info", JSON.stringify(profile));
    setInfoSaved(true);
    setTimeout(() => setInfoSaved(false), 3000);
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSaved(false);

    // Validate
    const savedPassword = localStorage.getItem("tt_profile_password");
    if (savedPassword && currentPassword !== savedPassword) {
      setPwError("Current password is incorrect.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    localStorage.setItem("tt_profile_password", newPassword);
    setHasPassword(true);
    setPwSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPwSaved(false), 3000);
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      alert("Firebase configuration not detected. Please verify your environment variables or setup Auth in Firebase Console.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Update local profile state from Google Account Info
      const newProfile = {
        displayName: user.displayName || profile.displayName || "Epic Adventurer",
        email: user.email || profile.email || "adventurer@tavern.local",
        discord: profile.discord || "",
      };
      setProfile(newProfile);
      localStorage.setItem("tt_profile_info", JSON.stringify(newProfile));
    } catch (err) {
      console.error("Google Sign-In failed:", err);
      alert("Sign-In failed. Make sure Google Sign-in is enabled in your Firebase Console and localhost/domain is authorized.");
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-Out failed:", err);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!auth) {
      setAuthError("Firebase Auth is not configured.");
      return;
    }

    try {
      if (authMode === "register") {
        if (authPassword !== authConfirmPassword) {
          setAuthError("Passwords do not match.");
          return;
        }
        if (authPassword.length < 6) {
          setAuthError("Password must be at least 6 characters.");
          return;
        }

        const credential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        
        await updateProfile(credential.user, {
          displayName: profile.displayName || "Epic Adventurer",
        });

        const newProfile = {
          ...profile,
          email: authEmail,
        };
        setProfile(newProfile);
        localStorage.setItem("tt_profile_info", JSON.stringify(newProfile));
      } else {
        const credential = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        
        const newProfile = {
          displayName: credential.user.displayName || profile.displayName || "Epic Adventurer",
          email: credential.user.email || authEmail,
          discord: profile.discord || "",
        };
        setProfile(newProfile);
        localStorage.setItem("tt_profile_info", JSON.stringify(newProfile));
      }

      setAuthEmail("");
      setAuthPassword("");
      setAuthConfirmPassword("");
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
    }
  };

  const getCampaignCharacterName = (campaignId: string): string => {
    if (typeof window === "undefined") return "No hero chosen";
    const charId = localStorage.getItem(`tt_campaign_char_${campaignId}`);
    if (!charId) return "No hero chosen";
    const char = localCharacters.find((c) => c.id === charId);
    return char ? char.name : "No hero chosen";
  };

  return (
    <main className="min-h-screen w-full bg-radial from-theme-radial-start via-theme-radial-mid to-theme-radial-end relative overflow-y-auto p-6 flex flex-col items-center">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

      {/* Header */}
      <div className="z-10 w-full max-w-4xl flex items-center justify-between pt-4 pb-8">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-350 transition-colors text-sm font-bold uppercase tracking-wider"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 text-xs font-black uppercase tracking-widest">Profile Page</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Profile Container */}
      <div className="z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 pb-16">
        
        {/* Left Column: Edit Forms */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Edit Contact Info */}
          <section className="bg-theme-card-bg border border-theme-card-border rounded-[32px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-theme-text-primary mb-1">Adventurer Details</h2>
                <p className="text-slate-500 text-xs leading-relaxed">Update your contact profile info below.</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <User className="w-5 h-5" />
              </div>
            </div>

            <form onSubmit={handleInfoSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    required
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl pl-11 pr-4 py-3 text-theme-text-primary text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                    <input
                      type="email"
                      required
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="adventurer@domain.com"
                      className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl pl-11 pr-4 py-3 text-theme-text-primary text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discord Tag</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                    <input
                      type="text"
                      value={profile.discord}
                      onChange={(e) => setProfile({ ...profile, discord: e.target.value })}
                      placeholder="e.g. Brad#1234"
                      className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl pl-11 pr-4 py-3 text-theme-text-primary text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {infoSaved ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider animate-pulse">
                    <Check className="w-4 h-4 stroke-[3px]" /> Profile Saved!
                  </span>
                ) : <span />}
                
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </section>

          {/* Password Info Section */}
          {!firebaseUser && (
            <section className="bg-theme-card-bg border border-theme-card-border rounded-[32px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-theme-text-primary mb-1">Passcode Credentials</h2>
                  <p className="text-slate-500 text-xs leading-relaxed">Modify your local app lock password.</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              <form onSubmit={handlePasswordSave} className="space-y-4">
                {hasPassword ? (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-4 py-3 text-theme-text-primary text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 text-slate-450 text-xs leading-relaxed">
                    No passcode set on this device yet. Enter a new password below to secure your local profile.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-4 py-3 text-theme-text-primary text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-4 py-3 text-theme-text-primary text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                {pwError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs font-semibold pl-1">
                    <AlertCircle className="w-4 h-4" />
                    {pwError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  {pwSaved ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider animate-pulse">
                      <Check className="w-4 h-4 stroke-[3px]" /> Password Changed!
                    </span>
                  ) : <span />}
                  
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Character Registry */}
          <section className="bg-theme-card-bg border border-theme-card-border rounded-[32px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-theme-text-primary mb-1">Character Registry</h2>
                <p className="text-slate-500 text-xs leading-relaxed">Manage your heroes and edit their background stories.</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Swords className="w-5 h-5" />
              </div>
            </div>

            {localCharacters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {localCharacters.map((char) => {
                  const isEditing = editingCharId === char.id;
                  if (isEditing) {
                    return (
                      <div 
                        key={char.id}
                        className="p-5 rounded-2xl border border-amber-500/40 bg-theme-card-bg/95 flex flex-col space-y-4 col-span-1 sm:col-span-2 shadow-xl shadow-amber-500/5 transition-all"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-theme-card-border">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-bold text-theme-text-primary">Edit Hero: {char.name}</h3>
                          </div>
                          <button
                            onClick={cancelEditing}
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-350 hover:bg-slate-500/10 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Form Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          
                          {/* Name Input */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Character Name</label>
                            <input
                              type="text"
                              required
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3 py-2 text-theme-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition-all"
                            />
                          </div>

                          {/* Level Input */}
                          <div className="space-y-1 col-span-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Level</label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={editLevel}
                              onChange={(e) => setEditLevel(Math.max(1, Math.min(20, Number(e.target.value))))}
                              className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3 py-2 text-theme-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition-all"
                            />
                          </div>

                          {/* Max HP Input */}
                          <div className="space-y-1 col-span-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Max HP</label>
                            <input
                              type="number"
                              min={1}
                              value={editMaxHp}
                              onChange={(e) => {
                                const val = Math.max(1, Number(e.target.value));
                                setEditMaxHp(val);
                                if (editCurrentHp > val) setEditCurrentHp(val);
                              }}
                              className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3 py-2 text-theme-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition-all"
                            />
                          </div>

                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          
                          {/* Current HP Input */}
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current HP</label>
                            <input
                              type="number"
                              min={0}
                              max={editMaxHp}
                              value={editCurrentHp}
                              onChange={(e) => setEditCurrentHp(Math.max(0, Math.min(editMaxHp, Number(e.target.value))))}
                              className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3 py-2 text-theme-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition-all"
                            />
                          </div>

                          {/* AC Input */}
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Armor Class (AC)</label>
                            <input
                              type="number"
                              min={1}
                              value={editAc}
                              onChange={(e) => setEditAc(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3 py-2 text-theme-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition-all"
                            />
                          </div>

                          {/* Initiative Mod Input */}
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Initiative Mod</label>
                            <input
                              type="number"
                              value={editInitiative}
                              onChange={(e) => setEditInitiative(Number(e.target.value))}
                              className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3 py-2 text-theme-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition-all"
                            />
                          </div>

                          {/* PP Input */}
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Passive Perception</label>
                            <input
                              type="number"
                              min={0}
                              value={editPassivePerception}
                              onChange={(e) => setEditPassivePerception(Math.max(0, Number(e.target.value)))}
                              className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3 py-2 text-theme-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition-all"
                            />
                          </div>

                        </div>

                        {/* Bios Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Public Backstory</label>
                            <textarea
                              rows={3}
                              value={editPublicBio}
                              onChange={(e) => setEditPublicBio(e.target.value)}
                              placeholder="Shared with the rest of the party..."
                              className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3 py-2 text-theme-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition-all placeholder:text-slate-500/75 resize-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Private Secrets (DM Eye Only)</label>
                            <textarea
                              rows={3}
                              value={editPrivateBio}
                              onChange={(e) => setEditPrivateBio(e.target.value)}
                              placeholder="Secret plots or background details..."
                              className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3 py-2 text-theme-text-primary text-xs focus:outline-none focus:border-amber-500/60 transition-all placeholder:text-slate-500/75 resize-none"
                            />
                          </div>

                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="px-4 py-2.5 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-bold text-xs uppercase tracking-widest transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCharacter(char.id)}
                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={char.id}
                      className="relative p-5 rounded-2xl border border-theme-card-border bg-theme-card-bg/60 hover:border-amber-500/30 hover:bg-theme-card-bg/80 transition-all flex flex-col justify-between space-y-4"
                    >
                      {/* Card Header (Delete & Edit buttons) */}
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1 pr-6">
                          <h3 className="text-base font-bold text-theme-text-primary truncate">{char.name}</h3>
                          <p className="text-theme-text-secondary text-xs font-semibold">
                            {RACE_DISPLAY_NAMES[char.race]} · {CLASS_DISPLAY_NAMES[char.className]}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => startEditing(char)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                            title="Edit character"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(char.id)}
                            className={`p-1.5 rounded-lg transition-all ${
                              confirmDeleteId === char.id
                                ? "bg-red-500 text-white"
                                : "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                            }`}
                            title={confirmDeleteId === char.id ? "Click again to confirm delete" : "Delete character"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="flex flex-col items-center bg-theme-input-bg/40 border border-theme-input-border/30 rounded-xl py-1.5 px-1">
                          <Heart className="w-3.5 h-3.5 text-red-500/80 mb-0.5" />
                          <span className="text-theme-text-primary text-xs font-bold font-mono">
                            {char.currentHp}/{char.maxHp}
                          </span>
                          <span className="text-slate-500 text-[8px] uppercase tracking-wider font-semibold">HP</span>
                        </div>
                        <div className="flex flex-col items-center bg-theme-input-bg/40 border border-theme-input-border/30 rounded-xl py-1.5 px-1">
                          <Shield className="w-3.5 h-3.5 text-blue-500/80 mb-0.5" />
                          <span className="text-theme-text-primary text-xs font-bold font-mono">{char.ac}</span>
                          <span className="text-slate-500 text-[8px] uppercase tracking-wider font-semibold">AC</span>
                        </div>
                        <div className="flex flex-col items-center bg-theme-input-bg/40 border border-theme-input-border/30 rounded-xl py-1.5 px-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500/80 mb-0.5" />
                          <span className="text-theme-text-primary text-xs font-bold font-mono">
                            {char.initiative >= 0 ? `+${char.initiative}` : char.initiative}
                          </span>
                          <span className="text-slate-500 text-[8px] uppercase tracking-wider font-semibold">Init</span>
                        </div>
                        <div className="flex flex-col items-center bg-theme-input-bg/40 border border-theme-input-border/30 rounded-xl py-1.5 px-1">
                          <Eye className="w-3.5 h-3.5 text-teal-500/80 mb-0.5" />
                          <span className="text-theme-text-primary text-xs font-bold font-mono">{char.passivePerception}</span>
                          <span className="text-slate-500 text-[8px] uppercase tracking-wider font-semibold">Percept</span>
                        </div>
                      </div>

                      {/* Bios Snippets */}
                      <div className="space-y-2 pt-1 border-t border-theme-card-border/40 text-[11px] leading-relaxed text-theme-text-secondary">
                        {char.publicBio ? (
                          <div className="line-clamp-2">
                            <span className="font-bold text-amber-500/90 uppercase tracking-wider text-[9px] mr-1">Public Bio:</span>
                            {char.publicBio}
                          </div>
                        ) : (
                          <div className="italic text-slate-500 text-[10px]">No public backstory written yet.</div>
                        )}
                        {char.privateBio ? (
                          <div className="line-clamp-2">
                            <span className="font-bold text-indigo-400/90 uppercase tracking-wider text-[9px] mr-1">Secrets (DM):</span>
                            {char.privateBio}
                          </div>
                        ) : null}
                      </div>
                      
                      {/* Level / Status footer */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                        <span>Level {char.level} Hero</span>
                        {char.status === "down" ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-wider">
                            Down
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-theme-card-border rounded-2xl bg-theme-input-bg/25 flex flex-col items-center">
                <p className="text-slate-500 text-sm mb-4">No characters created yet.</p>
                <Link 
                  href="/character/create" 
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all"
                >
                  Create Hero
                </Link>
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Associated Campaigns & Character info */}
        <div className="space-y-8">
          
          {/* Account Integration Card */}
          <section className="bg-theme-card-bg border border-theme-card-border rounded-[32px] p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-theme-text-primary mb-1">Account Sync</h2>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold uppercase tracking-wider">Authentication</p>
            </div>

            {authLoading ? (
              <div className="text-slate-650 text-xs animate-pulse">Checking credentials...</div>
            ) : firebaseUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-theme-input-bg border border-theme-input-border/40">
                  {firebaseUser.photoURL ? (
                    <img 
                      src={firebaseUser.photoURL} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full border border-indigo-500/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                      {firebaseUser.displayName?.[0] || firebaseUser.email?.[0] || "G"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-theme-text-primary text-xs font-bold truncate">{firebaseUser.displayName || "Adventurer"}</div>
                    <div className="text-slate-500 text-[10px] truncate">{firebaseUser.email}</div>
                  </div>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="w-full py-3 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-500 text-[11px] leading-relaxed pl-0.5">
                  Link with Google or create an email account to sync your characters across devices.
                </p>
                
                {/* Google Sign-in Option */}
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-md shadow-white/5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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

                {/* Email/Password Sign-in Option */}
                <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Email</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="adventurer@domain.com"
                      className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3.5 py-2.5 text-theme-text-primary text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Password</label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3.5 py-2.5 text-theme-text-primary text-xs placeholder:text-slate-550 focus:outline-none focus:border-indigo-500/60 transition-all"
                    />
                  </div>

                  {authMode === "register" && (
                    <div className="space-y-1 animate-slide-down">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-3.5 py-2.5 text-theme-text-primary text-xs placeholder:text-slate-550 focus:outline-none focus:border-indigo-500/60 transition-all"
                      />
                    </div>
                  )}

                  {authError && (
                    <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-semibold pl-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="leading-snug">{authError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-1.5">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      {authMode === "login" ? "Log In" : "Create Account"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === "login" ? "register" : "login");
                        setAuthError("");
                      }}
                      className="text-[10px] text-slate-550 hover:text-slate-350 font-bold transition-colors text-center py-1"
                    >
                      {authMode === "login" 
                        ? "Don't have an account? Sign Up" 
                        : "Already have an account? Log In"
                      }
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>

          <section className="bg-theme-card-bg border border-theme-card-border rounded-[32px] p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-theme-text-primary mb-1">Your Campaigns</h2>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold uppercase tracking-wider">Tavern Registry</p>
            </div>

            {/* DM Campaigns */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-indigo-400 pl-1 font-bold text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>DM Campaigns</span>
              </div>
              
              {dmCampaigns.length > 0 ? (
                <div className="space-y-2">
                  {dmCampaigns.map((camp) => (
                    <div 
                      key={camp.id}
                      className="p-3.5 rounded-2xl bg-theme-input-bg border border-theme-input-border/45 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${camp.themeColor}-500`} />
                        <span className="text-sm font-bold text-theme-text-primary">{camp.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                          DM
                        </span>
                        <button
                          onClick={(e) => handleDeleteDmCampaign(e, camp.id, camp.name)}
                          className="p-1 rounded-lg text-theme-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Remove Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-xs italic pl-1">No DM campaigns created yet.</p>
              )}
            </div>

            {/* Player Campaigns */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1.5 text-amber-500 pl-1 font-bold text-xs uppercase tracking-wider">
                <Swords className="w-4 h-4" />
                <span>Player Campaigns</span>
              </div>
              
              {playerCampaigns.length > 0 ? (
                <div className="space-y-2">
                  {playerCampaigns.map((camp) => (
                    <div 
                      key={camp.id}
                      className="p-3.5 rounded-2xl bg-theme-input-bg border border-theme-input-border/45 flex flex-col space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full bg-${camp.themeColor}-500`} />
                          <span className="text-sm font-bold text-theme-text-primary">{camp.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            Player
                          </span>
                          <button
                            onClick={(e) => handleDeletePlayerCampaign(e, camp.id, camp.name)}
                            className="p-1 rounded-lg text-theme-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Remove Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] pl-4 text-slate-500 font-medium">
                        Active Hero: <span className="text-theme-text-primary font-bold">{getCampaignCharacterName(camp.id)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-xs italic pl-1">No campaigns joined yet.</p>
              )}
            </div>
          </section>

        </div>
        
      </div>
    </main>
  );
}
