"use client";

import { use, Suspense } from "react";
import CharacterWizard from "@/components/CharacterWizard";
import { useSearchParams } from "next/navigation";

function WizardWrapper() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("join") || undefined;
  
  return <CharacterWizard campaignId={campaignId} />;
}

export default function CreateCharacterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-theme-bg" />}>
      <WizardWrapper />
    </Suspense>
  );
}
