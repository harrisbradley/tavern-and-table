import PlayerFlow from "@/components/PlayerFlow";
import { use } from "react";

export default function PlayerPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params);
  return <PlayerFlow campaignId={campaignId} />;
}
