import { useState } from "react";
import { ChevronRight } from "lucide-react";
import ContentStudioPage from "../ContentStudioPage";
import AIWriter from "./AIWriter";
import GrammarChecker from "./GrammarChecker";
import DocumentEditor from "./DocumentEditor";
import PresentationAI from "./PresentationAI";
import SEOOptimizer from "./SEOOptimizer";
import VoiceOverAI from "./VoiceOverAI";

const ContentHub = () => {
  const [active, setActive] = useState("studio");

  const tabs = [
    { id: "studio", label: "Studio", component: ContentStudioPage },
    { id: "writer", label: "Writer", component: AIWriter },
    { id: "grammar", label: "Grammar", component: GrammarChecker },
    { id: "editor", label: "Editor", component: DocumentEditor },
    { id: "presentation", label: "Presentation", component: PresentationAI },
    { id: "seo", label: "SEO", component: SEOOptimizer },
    { id: "voiceover", label: "Voiceover", component: VoiceOverAI },
  ];

  const ActiveComponent = tabs.find(t => t.id === active)?.component;

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-background px-6 py-3 flex gap-1 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-all flex items-center gap-1 whitespace-nowrap ${
              active === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
            {active === tab.id && <ChevronRight className="w-3 h-3" />}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default ContentHub;
