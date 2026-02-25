// =====================================================
// ROADMAP DATA — Extracted from rm.pptx (4 slides)
// 2026 Solutions Synthetic Roadmap
// =====================================================

export type RoadmapStatus = "completed" | "in-progress" | "planned" | "pipeline";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  targetDate: string;
  category: string;
  stream: string;
  priority: "high" | "medium" | "low";
  progress: number;
}

export interface RoadmapStream {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  items: RoadmapItem[];
}

export const roadmapStreams: RoadmapStream[] = [
  {
    id: "rainbow-portfolio",
    name: "Rainbow Product Portfolio",
    subtitle: "Strategic Evolution of Core Products",
    color: "#3b82f6",
    items: [
      { id: "rb-generic-ai", title: "Rainbow Generic — AI Premium Upsell", description: "Position AI-powered services as premium upsell opportunities to drive ARPU growth.", status: "in-progress", targetDate: "H1 2026", category: "Product", stream: "rainbow-portfolio", priority: "high", progress: 35 },
      { id: "rb-hub-smartrouting", title: "Rainbow Hub — AI SmartRouting & CCaaS-lite", description: "Develop AI-driven SmartRouting and CCaaS-lite offer. Improve flexibility on numbering & trunking to expand to new markets.", status: "in-progress", targetDate: "H1 2026", category: "Product", stream: "rainbow-portfolio", priority: "high", progress: 45 },
      { id: "rb-edge-partner", title: "Rainbow Edge — Partner Enablement", description: "Industrialize Edge for full partner enablement. Package Edge PRO for OpenTouch transition acceleration.", status: "in-progress", targetDate: "2026", category: "Product", stream: "rainbow-portfolio", priority: "high", progress: 30 },
      { id: "rb-webinar-gtm", title: "Rainbow Webinar — Digital GTM", description: "Enable full digital go-to-market strategy with a 'try-and-buy' ready solution.", status: "planned", targetDate: "2026", category: "Product", stream: "rainbow-portfolio", priority: "medium", progress: 0 },
      { id: "rb-guardian-ai", title: "Rainbow Guardian — AI Crisis Management", description: "Implement AI-based crisis management automation services.", status: "planned", targetDate: "2026", category: "Product", stream: "rainbow-portfolio", priority: "medium", progress: 0 },
    ],
  },
  {
    id: "ai-communications",
    name: "AI-Augmented Communications",
    subtitle: "Smart Workflow Powered by AI",
    color: "#8b5cf6",
    items: [
      { id: "ai-bubbles", title: "Rainbow Bubbles — Transcription, Summary & Recording", description: "Transform calls & meetings with transcription, summary & recording navigation.", status: "in-progress", targetDate: "April 2026", category: "AI Feature", stream: "ai-communications", priority: "high", progress: 60 },
      { id: "ai-byo-prompt", title: "BYO Prompt for Personalization", description: "Bring Your Own Prompt — adapt AI to customer context for personalized experiences.", status: "in-progress", targetDate: "April 2026", category: "AI Feature", stream: "ai-communications", priority: "high", progress: 50 },
      { id: "ai-caption-translate", title: "Live Caption & File Translation", description: "Real-time captioning and document translation capabilities.", status: "planned", targetDate: "June 2026", category: "AI Feature", stream: "ai-communications", priority: "medium", progress: 0 },
      { id: "ai-live-translation", title: "Live Translation", description: "Real-time speech translation across languages during calls and meetings.", status: "planned", targetDate: "H2 2026", category: "AI Feature", stream: "ai-communications", priority: "medium", progress: 0 },
      { id: "ai-agentic", title: "Rainbow Agentic AI", description: "Autonomous AI agents for workflow automation within Rainbow platform.", status: "planned", targetDate: "H2 2026", category: "AI Feature", stream: "ai-communications", priority: "high", progress: 0 },
      { id: "ai-hybrid-transcript", title: "Hybrid Calls Transcript & Summary", description: "Transcription and summary for hybrid (cloud + on-premise) calls.", status: "planned", targetDate: "June 2026", category: "AI Feature", stream: "ai-communications", priority: "medium", progress: 0 },
      { id: "ai-native-sovereign", title: "Native Rainbow AI (Sovereign — ChapsVision)", description: "Built-in sovereign AI powered by ChapsVision, available in France & Germany.", status: "in-progress", targetDate: "April 2026 (FR-DE)", category: "AI Platform", stream: "ai-communications", priority: "high", progress: 55 },
      { id: "ai-byo-ai", title: "Bring Your Own AI", description: "Customers bring their own AI provider, worldwide availability.", status: "in-progress", targetDate: "April 2026 (WW)", category: "AI Platform", stream: "ai-communications", priority: "high", progress: 50 },
    ],
  },
  {
    id: "customer-relation",
    name: "New-Gen Customer Relation",
    subtitle: "SmartRouting AI & CCaaS-Lite",
    color: "#10b981",
    items: [
      { id: "cr-smartrouting", title: "Rainbow SmartRouting AI — Conversational Agent", description: "Intelligent welcome & routing with natural language pre-qualification and VIP identification.", status: "in-progress", targetDate: "H1 2026", category: "CCaaS", stream: "customer-relation", priority: "high", progress: 40 },
      { id: "cr-calendar-routing", title: "VIP Identification & Calendar-Based Routing", description: "Automatic VIP detection and calendar-aware call routing.", status: "in-progress", targetDate: "H1 2026", category: "CCaaS", stream: "customer-relation", priority: "high", progress: 35 },
      { id: "cr-context-transmission", title: "Call Context Transmission", description: "Pre-qualification data and context passed seamlessly to agents.", status: "planned", targetDate: "2026", category: "CCaaS", stream: "customer-relation", priority: "medium", progress: 0 },
      { id: "cr-ccaas-lite", title: "Rainbow CCaaS-Lite — Omnichannel", description: "Voice & digital channels with Click-to-Connect, queue monitoring, and advanced analytics.", status: "in-progress", targetDate: "2026", category: "CCaaS", stream: "customer-relation", priority: "high", progress: 25 },
      { id: "cr-wrapup-queue", title: "Agent Wrap-up & Queue Monitoring", description: "Agents wrap-up management, queue monitoring & pick-up, real-time queue position for callers.", status: "planned", targetDate: "2026", category: "CCaaS", stream: "customer-relation", priority: "medium", progress: 0 },
      { id: "cr-whatsapp", title: "WhatsApp Connector", description: "WhatsApp and Facebook Messenger integration for customer conversations.", status: "planned", targetDate: "2026", category: "Channels", stream: "customer-relation", priority: "medium", progress: 0 },
      { id: "cr-video-escalation", title: "Audio/Video Escalation from Chat", description: "Escalate phone call to video via SMS link. B2C app-less web chat.", status: "planned", targetDate: "2026", category: "Channels", stream: "customer-relation", priority: "low", progress: 0 },
      { id: "cr-hybrid-pbx", title: "SmartRouting for On-Prem PBX", description: "SmartRouting service for on-prem PBX users via trunking. Seamless transition path.", status: "planned", targetDate: "2026", category: "Hybrid", stream: "customer-relation", priority: "medium", progress: 0 },
    ],
  },
  {
    id: "infrastructure",
    name: "Infrastructure & Compliance",
    subtitle: "Certification, Accessibility & DC Expansion",
    color: "#f59e0b",
    items: [
      { id: "infra-c5-de", title: "C5 Certification (Germany)", description: "Cloud Computing Compliance Criteria Catalogue — German security certification.", status: "completed", targetDate: "Achieved", category: "Certification", stream: "infrastructure", priority: "high", progress: 100 },
      { id: "infra-acn-it", title: "ACN Certification (Italy)", description: "Italian national cybersecurity certification.", status: "completed", targetDate: "Achieved", category: "Certification", stream: "infrastructure", priority: "high", progress: 100 },
      { id: "infra-vsnfd-de", title: "VS-NFD Certification (Germany)", description: "German classified information processing certification.", status: "pipeline", targetDate: "2026", category: "Certification", stream: "infrastructure", priority: "high", progress: 0 },
      { id: "infra-ens-es", title: "ENS Renewal (Spain)", description: "Spanish National Security Framework renewal.", status: "pipeline", targetDate: "2026", category: "Certification", stream: "infrastructure", priority: "medium", progress: 0 },
      { id: "infra-cspn-fr", title: "CSPN Renewal (France)", description: "French first-level security certification renewal.", status: "pipeline", targetDate: "2026", category: "Certification", stream: "infrastructure", priority: "medium", progress: 0 },
      { id: "infra-accessibility", title: "Accessibility — WCAG / RGAA / BITV2.0", description: "Rainbow HelpCenter WCAG compliance. Roadmap: RGAA (FR), BITV2.0 (DE), WCAG AA, Admin coverage.", status: "in-progress", targetDate: "2026", category: "Compliance", stream: "infrastructure", priority: "medium", progress: 20 },
      { id: "infra-dc-australia", title: "Australia Rainbow Hub — New DC", description: "New infrastructure deployment for Australian market.", status: "planned", targetDate: "2026", category: "Infrastructure", stream: "infrastructure", priority: "high", progress: 0 },
      { id: "infra-dc-brazil", title: "Brazil DC Expansion", description: "Supporting Hub strong growth in Brazilian market.", status: "planned", targetDate: "2026", category: "Infrastructure", stream: "infrastructure", priority: "high", progress: 0 },
      { id: "infra-dc-china", title: "New China DC", description: "Market expansion with new data center in China.", status: "planned", targetDate: "2026", category: "Infrastructure", stream: "infrastructure", priority: "medium", progress: 0 },
      { id: "infra-dc-germany2", title: "Second DC Provider in Germany", description: "DC provider diversification for redundancy.", status: "planned", targetDate: "2026", category: "Infrastructure", stream: "infrastructure", priority: "medium", progress: 0 },
      { id: "infra-dc-europe-south", title: "DC Diversification Europe South", description: "DC provider diversification in Southern Europe.", status: "planned", targetDate: "2026", category: "Infrastructure", stream: "infrastructure", priority: "low", progress: 0 },
    ],
  },
];
