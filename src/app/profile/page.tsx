"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, User, Mail, MessageSquare, Lock, Shield, Swords, Sparkles, Check, AlertCircle 
} from "lucide-react";
import { getCharacters } from "@/lib/characterEngine";
import { Character } from "@/types/character";

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

  // History States
  const [dmCampaigns, setDmCampaigns] = useState<CampaignInfo[]>([]);
  const [playerCampaigns, setPlayerCampaigns] = useState<CampaignInfo[]>([]);
  const [localCharacters, setLocalCharacters] = useState<Character[]>([]);

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

  const getCampaignCharacterName = (campaignId: string): string => {
    if (typeof window === "undefined") return "No hero chosen";
    const charId = localStorage.getItem(`tt_campaign_char_${campaignId}`);
    if (!charId) return "No hero chosen";
    const char = localCharacters.find((c) => c.id === charId);
    return char ? char.name : "No hero chosen";
  };

  return (
    <main className="min-h-screen w-full bg-radial from-[#1e1135] via-[#090b12] to-[#040508] relative overflow-y-auto p-6 flex flex-col items-center">
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
        <div className="w-16" />
      </div>

      {/* Profile Container */}
      <div className="z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 pb-16">
        
        {/* Left Column: Edit Forms */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Edit Contact Info */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Adventurer Details</h2>
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
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-700 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
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
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-700 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
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
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-sm placeholder:text-slate-700 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
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
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Passcode Credentials</h2>
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
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
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
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
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
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-3 text-slate-200 text-sm placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
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

        </div>

        {/* Right Column: Associated Campaigns & Character info */}
        <div className="space-y-8">
          
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Your Campaigns</h2>
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
                      className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-850/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${camp.themeColor}-500`} />
                        <span className="text-sm font-bold text-slate-200">{camp.name}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        DM
                      </span>
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
                      className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-850/60 flex flex-col space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full bg-${camp.themeColor}-500`} />
                          <span className="text-sm font-bold text-slate-200">{camp.name}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                          Player
                        </span>
                      </div>
                      <div className="text-[10px] pl-4 text-slate-500 font-medium">
                        Active Hero: <span className="text-slate-350 font-bold">{getCampaignCharacterName(camp.id)}</span>
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
