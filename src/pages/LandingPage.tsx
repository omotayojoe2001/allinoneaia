import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  MessageSquare,
  Zap,
  Headphones,
  Palette,
  Share2,
  Briefcase,
  Bell,
  Sparkles,
  ArrowRight,
  Check,
  Bot,
  Play,
  Shield,
  Globe,
  Mail,
  Phone,
  Video,
  Image,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  BarChart,
  Clock,
  Workflow,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PricingSection from "@/components/PricingSection";
import ThemeToggle from "@/components/ThemeToggle";

const features = [
  {
    icon: Bot,
    title: "AI Chatbot Builder",
    subtitle: "Your 24/7 Customer Service Agent",
    description: "Build intelligent chatbots that respond to your clients instantly across WhatsApp, Telegram, and your website. No coding required - just set it up once and let AI handle customer conversations, answer questions, qualify leads, and book appointments while you sleep.",
    highlights: [
      "WhatsApp Business API integration - respond to customers instantly",
      "Telegram bots that handle unlimited conversations",
      "Web chat widgets that embed on any website",
      "Smart auto-replies that understand context and intent",
      "Lead qualification and appointment booking automation",
      "Multi-language support for global customers",
    ],
    color: "--module-chat",
  },
  {
    icon: Zap,
    title: "Automation Hub",
    subtitle: "Set It Once, Run Forever",
    description: "Automate your entire communication workflow. Send personalized emails, WhatsApp messages, and follow-ups automatically based on customer behavior. Create sequences that nurture leads, onboard clients, and re-engage dormant customers - all on autopilot.",
    highlights: [
      "WhatsApp automation - bulk messages, drip campaigns, and smart follow-ups",
      "Email sequences that send at the perfect time",
      "Trigger-based automation - actions happen when customers do something",
      "Smart follow-ups that know when to reach out",
      "A/B testing to optimize your messages",
      "Analytics dashboard to track what's working",
    ],
    color: "--module-automation",
  },
  {
    icon: Headphones,
    title: "AI Customer Service",
    subtitle: "Handle Calls & Support Like a Pro",
    description: "Let AI handle your customer service calls, create summaries, and manage support tickets. Your AI assistant answers common questions, escalates complex issues, and keeps your customers happy 24/7 without hiring a team.",
    highlights: [
      "AI call handling - answers customer calls with natural voice",
      "Automatic call summaries - know what was discussed instantly",
      "Ticket management system - organize and prioritize support requests",
      "Smart routing - sends complex issues to the right person",
      "Customer history tracking - AI remembers past conversations",
      "Multi-channel support - phone, email, chat, all in one place",
    ],
    color: "--module-customer",
  },
  {
    icon: Palette,
    title: "Content Studio",
    subtitle: "Create Everything with AI",
    description: "Your complete content creation powerhouse. Generate stunning graphics, write compelling copy, create videos, edit footage, and design social media posts - all with AI. Go on vacation for 30 days and your content keeps posting automatically. Your AI agent creates, schedules, and publishes while you're away.",
    highlights: [
      "AI graphic designer - create logos, banners, social posts, and ads",
      "AI copywriter - blogs, captions, emails, and sales copy in seconds",
      "Video creator - turn text into engaging videos with AI",
      "Video editor - cut, trim, add effects, and enhance videos automatically",
      "AI voiceovers - natural-sounding voices in multiple languages",
      "Auto-posting - schedule 30+ days of content and forget about it",
      "Content calendar - AI suggests what to post and when",
      "Shorts creator - turn long videos into viral short clips",
    ],
    color: "--module-content",
  },
  {
    icon: Share2,
    title: "Social Media Growth Engine",
    subtitle: "Grow Your Presence on Autopilot",
    description: "Manage all your social platforms from one dashboard. Schedule posts across Facebook, Instagram, Twitter, LinkedIn, and TikTok. Plus, boost your presence with real followers, likes, views, and engagement packages. Watch your accounts grow while you focus on your business.",
    highlights: [
      "Multi-platform posting - publish to all networks at once",
      "Growth packages - buy real followers, likes, and engagement",
      "Facebook page growth - increase likes, comments, and shares",
      "Instagram growth - gain followers and boost post engagement",
      "Video views packages - get more eyes on your content",
      "Photo engagement - increase likes and comments on images",
      "Analytics dashboard - track growth across all platforms",
      "Best time to post - AI tells you when your audience is active",
    ],
    color: "--module-social",
  },
  {
    icon: Briefcase,
    title: "Business Tools Suite",
    subtitle: "Run Your Business Smarter",
    description: "Everything you need to manage your business operations. AI-powered spreadsheet assistant that analyzes data and creates reports, attendance tracking for your team, and a complete cashbook for financial management. Your business operations, simplified.",
    highlights: [
      "Spreadsheet AI - ask questions about your data in plain English",
      "Automatic data analysis - AI finds insights you'd miss",
      "Attendance tracking - clock in/out system for employees",
      "Cashbook - track income, expenses, and profit automatically",
      "Financial reports - generate P&L statements instantly",
      "Invoice generator - create and send professional invoices",
      "Inventory management - track stock levels and get alerts",
      "Team collaboration - share data securely with your team",
    ],
    color: "--module-business",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    subtitle: "Never Miss What Matters",
    description: "AI that understands your tasks and reminds you at the perfect moment. It detects your intentions from conversations and notes, then prompts you exactly when you need to take action. No more forgotten follow-ups or missed deadlines.",
    highlights: [
      "Intent detection - AI understands what you need to do",
      "Smart scheduling - reminds you at the optimal time",
      "Context-aware prompts - knows what you're working on",
      "Follow-up automation - never forget to check in with clients",
      "Recurring reminders - set it once for daily/weekly tasks",
      "Priority sorting - important tasks get highlighted",
    ],
    color: "--module-reminders",
  },
  {
    icon: Sparkles,
    title: "Life Automation",
    subtitle: "Remove Repetitive Tasks Forever",
    description: "The ultimate personal AI assistant. Blend AI and automation to eliminate repetitive daily tasks. From morning routines to evening wrap-ups, let AI handle the boring stuff so you can focus on what matters. Your life, automated.",
    highlights: [
      "Daily task automation - morning and evening routines on autopilot",
      "Workflow builder - create custom automation sequences",
      "Done-for-you templates - pre-built automations you can use instantly",
      "Smart home integration - control devices with AI commands",
      "Personal assistant - AI handles scheduling, emails, and more",
      "Habit tracking - AI helps you build and maintain good habits",
    ],
    color: "--module-life",
    status: "coming-soon" as const,
  },
];

const stats = [
  { label: "AI Models Connected", value: "12+" },
  { label: "Automations Run", value: "2.4M" },
  { label: "Active Users", value: "18K" },
  { label: "Time Saved (hrs)", value: "500K+" },
];

const trustedFeatures = [
  { icon: Shield, title: "Enterprise Security", desc: "Your data is encrypted end-to-end with SOC 2 compliance." },
  { icon: Globe, title: "Works Everywhere", desc: "Access from any device, any browser, anywhere in the world." },
  { icon: Play, title: "Instant Setup", desc: "No coding needed. Sign up and start automating in under 2 minutes." },
];

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slidesPerView = 3;
  const totalSlides = Math.ceil(features.length / slidesPerView);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  const visibleFeatures = features.slice(
    currentSlide * slidesPerView,
    (currentSlide + 1) * slidesPerView
  );

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg">BizSuiteAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link>
            <Link to="/fund-us" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fund Us</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-foreground text-sm font-medium hover:text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 relative"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -90, 0],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
            />
          </div>

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block text-xs font-medium bg-primary/10 text-primary px-4 py-1.5 rounded-full mb-6 relative z-10"
          >
            🚀 All-in-one AI workspace — no coding required
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight relative z-10"
          >
            Build, Automate & Create{" "}
            <motion.span
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="gradient-text inline-block"
              style={{
                backgroundSize: "200% auto",
              }}
            >
              with AI
            </motion.span>
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-4 mb-8 relative z-10"
          >
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto font-medium">
              The only platform you need to run your entire creative business
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground max-w-3xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full"
              >
                <Bot className="w-4 h-4 text-primary" />
                <span>Build AI Chatbots</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full"
              >
                <Zap className="w-4 h-4 text-primary" />
                <span>Automate Everything</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full"
              >
                <Palette className="w-4 h-4 text-primary" />
                <span>Create Content</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full"
              >
                <Share2 className="w-4 h-4 text-primary" />
                <span>Grow Social Media</span>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-4 flex-wrap relative z-10"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/signup"
                className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-base font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/25"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/login"
                className="border-2 border-border text-foreground px-8 py-4 rounded-lg text-base font-medium hover:bg-secondary transition-colors"
              >
                View Demo
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-xs text-muted-foreground mt-6 relative z-10"
          >
            ✨ No credit card required · Free plan available · 2 minutes setup
          </motion.p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="glass-card rounded-lg p-4 text-center cursor-pointer"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                className="text-2xl font-bold text-foreground"
              >
                {stat.value}
              </motion.div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Animated Platform Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-20 relative"
        >
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
            {/* Animated gradient background */}
            <motion.div
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-10"
              style={{
                background: "linear-gradient(45deg, hsl(var(--primary)), hsl(var(--module-content)), hsl(var(--module-social)), hsl(var(--primary)))",
                backgroundSize: "400% 400%",
              }}
            />
            
            <div className="relative z-10 text-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              <h3 className="text-2xl font-bold text-foreground mb-2">See It In Action</h3>
              <p className="text-muted-foreground">Watch how BizSuiteAI transforms your workflow</p>
            </div>

            {/* Floating feature cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
              {[
                { icon: Bot, label: "AI Chatbots", color: "--module-chat" },
                { icon: Zap, label: "Automation", color: "--module-automation" },
                { icon: Palette, label: "Content Studio", color: "--module-content" },
                { icon: Share2, label: "Social Growth", color: "--module-social" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: [0, -10, 0],
                  }}
                  transition={{
                    opacity: { delay: 0.6 + i * 0.1 },
                    y: { duration: 2, repeat: Infinity, delay: i * 0.2 },
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="bg-background/50 backdrop-blur-sm rounded-xl p-4 text-center cursor-pointer"
                >
                  <div
                    className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center"
                    style={{ background: `hsl(var(${item.color}) / 0.15)` }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: `hsl(var(${item.color}))` }} />
                  </div>
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Trust Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {trustedFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-foreground font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Video Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3">See BizSuiteAI in Action</h2>
            <p className="text-muted-foreground">Watch how easy it is to automate your entire business</p>
          </div>
          <div className="rounded-2xl overflow-hidden relative aspect-video max-w-4xl mx-auto shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="BizSuiteAI Platform Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
            />
          </div>
        </motion.div>

        {/* Human Touch Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="glass-card rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Built by Creators, for Creators
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  We understand the struggle of managing multiple tools, paying for expensive subscriptions, and wasting time on repetitive tasks. That's why we built BizSuiteAI - to give you everything you need in one place.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <img src="https://i.pravatar.cc/150?img=1" alt="User" className="w-10 h-10 rounded-full border-2 border-background" />
                    <img src="https://i.pravatar.cc/150?img=2" alt="User" className="w-10 h-10 rounded-full border-2 border-background" />
                    <img src="https://i.pravatar.cc/150?img=3" alt="User" className="w-10 h-10 rounded-full border-2 border-background" />
                    <img src="https://i.pravatar.cc/150?img=4" alt="User" className="w-10 h-10 rounded-full border-2 border-background" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">18,000+ Happy Users</p>
                    <p className="text-xs text-muted-foreground">Join the community</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop" 
                  alt="Team collaboration" 
                  className="rounded-2xl w-full h-full object-cover shadow-xl"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modules Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-foreground text-center mb-3"
          >
            Everything You Need, Explained
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground text-center max-w-3xl mx-auto"
          >
            Explore our powerful modules
          </motion.p>
        </motion.div>

        {/* Carousel */}
        <div className="relative mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {visibleFeatures.map((feature, i) => (
                <motion.div
                  key={`${currentSlide}-${i}`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="glass-card rounded-2xl p-6 relative overflow-hidden"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl"
                    style={{ background: `hsl(var(${feature.color}))` }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `hsl(var(${feature.color}) / 0.15)` }}
                      >
                        <feature.icon className="w-6 h-6" style={{ color: `hsl(var(${feature.color}))` }} />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                          {feature.status === "coming-soon" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium" style={{ color: `hsl(var(${feature.color}))` }}>
                          {feature.subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>

                    <div className="space-y-2">
                      <h4 className="text-foreground font-semibold text-sm">Key Features:</h4>
                      <div className="space-y-1.5">
                        {feature.highlights.slice(0, 4).map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: `hsl(var(${feature.color}))` }} />
                            <span className="text-xs text-foreground">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-primary" />
            </motion.button>
            <div className="flex gap-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentSlide ? "w-8 bg-primary" : "w-2 bg-primary/30"
                  }`}
                />
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </motion.button>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-foreground mb-3">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground">Choose the plan that fits your needs</p>
          </motion.div>
          <PricingSection />
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-12 text-center mb-20 relative overflow-hidden"
        >
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-primary/20 blur-3xl"
          />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything AI. One Platform.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of businesses automating their workflow and growing faster with BizSuiteAI
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/signup"
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-base font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/25"
                >
                  Start Your Free Trial <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              ✨ No credit card required · Cancel anytime · 2 minutes setup
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="border-t border-border mt-16 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">BizSuiteAI</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your all-in-one AI workspace for automation, content, and growth.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Integrations</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© 2026 BizSuiteAI. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Twitter</Link>
              <Link to="/" className="hover:text-foreground transition-colors">LinkedIn</Link>
              <Link to="/" className="hover:text-foreground transition-colors">Discord</Link>
              <Link to="/" className="hover:text-foreground transition-colors">YouTube</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
