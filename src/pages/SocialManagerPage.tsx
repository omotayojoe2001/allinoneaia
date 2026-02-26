import { Share2, Clock } from "lucide-react";
import { PageAIAgent } from "@/components/PageAIAgent";
import { pageAgentConfigs } from "@/lib/page-agent-configs";

export default function SocialManagerPage() {
  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-8">
      <PageAIAgent {...pageAgentConfigs.social} />
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Share2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Social Manager</h1>
        <p className="text-muted-foreground mb-6">
          Schedule and manage your social media posts across multiple platforms. This feature is coming soon!
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
