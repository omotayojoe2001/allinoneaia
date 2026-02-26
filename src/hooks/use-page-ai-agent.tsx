import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs, PageAgentKey } from '@/lib/page-agent-configs';

/**
 * Hook to easily add AI agent to any page
 * @param pageKey - The key from pageAgentConfigs
 * @param position - Position of the AI agent button
 * @returns JSX element for the AI agent
 */
export const usePageAIAgent = (
  pageKey: PageAgentKey, 
  position: 'bottom-right' | 'top-right' = 'bottom-right'
) => {
  const config = pageAgentConfigs[pageKey];
  
  if (!config) {
    console.warn(`No AI agent config found for page: ${pageKey}`);
    return null;
  }

  return <PageAIAgent {...config} position={position} />;
};
