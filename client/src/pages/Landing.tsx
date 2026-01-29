import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowRight, 
  Bot, 
  Network, 
  FileText, 
  Quote,
  Brain,
  Layers,
  Shield,
  Upload,
  Image,
  Sparkles,
  MessageSquare,
  FileSearch,
  ImageIcon,
  GitBranch,
  ListChecks,
  Home,
  Info,
  LogIn,
  UserPlus
} from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Lead Researcher, BioTech Solutions",
    content: "NeoGraphQA has transformed how we handle our clinical research. The ability to visualize relationships between complex datasets is a game-changer.",
    avatar: "SC"
  },
  {
    name: "Marcus Thorne",
    role: "CTO, DataNexus",
    content: "The most intuitive GraphRAG platform I've used. It bridges the gap between raw data and actionable intelligence seamlessly.",
    avatar: "MT"
  },
  {
    name: "Elena Rodriguez",
    role: "Knowledge Manager, Global Logistics",
    content: "Extracting insights from thousands of logistics reports used to take weeks. Now it happens in minutes with neo-precision.",
    avatar: "ER"
  }
];

const features = [
  {
    icon: FileSearch,
    title: "PDF Question Answering",
    description: "Upload PDFs and ask questions directly. Get accurate answers extracted from your documents instantly."
  },
  {
    icon: ImageIcon,
    title: "Image Question Answering",
    description: "Analyze images and ask questions about visual content. Our AI understands charts, diagrams, and photos."
  },
  {
    icon: GitBranch,
    title: "Knowledge Graph Reasoning",
    description: "Build and query knowledge graphs from your data. Discover hidden relationships and connections."
  },
  {
    icon: ListChecks,
    title: "Summarization",
    description: "Generate concise summaries from lengthy documents. Extract key points and insights effortlessly."
  },
  {
    icon: MessageSquare,
    title: "Chatbot",
    description: "Interactive AI chatbot powered by your knowledge base. Get conversational answers to complex queries."
  }
];

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              NeoGraphQA
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#hero" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors" data-testid="link-home">
              <Home className="w-4 h-4" />
              Home
            </a>
            <a href="#about" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors" data-testid="link-about">
              <Info className="w-4 h-4" />
              About
            </a>
            <Link href="/login" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors" data-testid="link-login">
              <LogIn className="w-4 h-4" />
              Login
            </Link>
            <Button size="sm" className="font-semibold shadow-lg shadow-primary/20" onClick={() => navigate("/signup")} data-testid="button-signup">
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up
            </Button>
          </div>

          <div className="md:hidden">
            <Button size="sm" className="font-semibold" onClick={() => navigate("/login")} data-testid="button-get-started-mobile">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-16 px-6 overflow-hidden">
        {/* Abstract Background Blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] -z-10 animate-pulse delay-1000" />

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border text-sm font-medium text-muted-foreground"
          >
            <SparkleIcon className="w-4 h-4 text-accent" />
            <span>Next-Generation Knowledge Analysis</span>
          </motion.div>
          
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className="text-4xl md:text-6xl font-bold font-display tracking-tight leading-[1.1]"
          >
            Unlock Intelligence from <br/>
            <span className="text-primary">Documents</span> & <span className="text-accent">Knowledge Graphs</span>
          </motion.h1>
          
          <motion.p 
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            A multi-modal platform that transforms PDFs, text, and images into a queryable knowledge base using advanced Graph RAG.
          </motion.p>

          {/* Large Input Box */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className="max-w-2xl mx-auto pt-4"
          >
            <div className="relative">
              <Input 
                type="text"
                placeholder="What can I help with?"
                className="w-full h-14 px-6 text-lg rounded-2xl border-2 border-border/50 bg-card shadow-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                data-testid="input-main-query"
              />
              <Button 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl"
                data-testid="button-submit-query"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Button variant="outline" className="h-11 px-6 rounded-xl border-2 hover:border-primary/50" data-testid="button-upload-pdf">
              <FileText className="w-4 h-4 mr-2" />
              Upload PDF
            </Button>
            <Button variant="outline" className="h-11 px-6 rounded-xl border-2 hover:border-primary/50" data-testid="button-upload-image">
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
            <Button variant="outline" className="h-11 px-6 rounded-xl border-2 hover:border-accent/50" data-testid="button-generate-image">
              <Sparkles className="w-4 h-4 mr-2 text-accent" />
              Generate Image
            </Button>
          </motion.div>

          {/* Login to Experience Button */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className="pt-4"
          >
            <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl shadow-primary/20 transition-all hover:scale-105" onClick={() => navigate("/login")} data-testid="button-login-experience">
              Login to Experience
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-12 space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to extract, analyze, and understand your data.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <FeatureCard 
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold">What is NeoGraph AI?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We combine the power of Large Language Models with Knowledge Graphs to eliminate hallucinations and provide structured, verifiable insights from your data.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Modal Intelligence</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Seamlessly process PDFs, images, and raw text. Our AI understands layout, visual context, and complex relationships simultaneously.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Knowledge Structuring</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Transform unstructured data into a graph of nodes and relationships. Visualize how concepts connect across your entire library.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verifiable Accuracy</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Every answer provided is grounded in your specific documents. Graph-based retrieval ensures higher precision than standard RAG.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 overflow-hidden bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6"
          >
            <div className="space-y-4 text-left">
              <h2 className="text-3xl md:text-5xl font-display font-bold">Trusted by experts</h2>
              <p className="text-muted-foreground max-w-xl">
                See how researchers, engineers, and knowledge workers are using NeoGraph AI to unlock insights.
              </p>
            </div>
            <div className="flex items-center gap-4 text-primary font-bold">
              <span className="text-4xl">500+</span>
              <span className="text-muted-foreground font-normal text-left text-sm uppercase tracking-widest leading-none">Global <br /> Organizations</span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card p-6 rounded-2xl border border-border relative group hover:shadow-lg transition-shadow"
                data-testid={`card-testimonial-${i}`}
              >
                <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                <p className="text-foreground/90 italic mb-8 relative z-10 text-left">"{t.content}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold">{t.name}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of researchers and professionals using NeoGraphQA to unlock insights from their data.
            </p>
            <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl shadow-primary/20 transition-all hover:scale-105" onClick={() => navigate("/login")} data-testid="button-cta-login">
              Login to Experience
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 text-center text-sm text-muted-foreground border-t border-border/50 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 gap-8">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">NeoGraphQA</span>
          </div>
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-primary transition-colors" data-testid="link-privacy">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors" data-testid="link-terms">Terms</a>
            <a href="#" className="hover:text-primary transition-colors" data-testid="link-contact">Contact</a>
          </div>
          <p>© 2026 NeoGraphQA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group h-full">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold font-display mb-2 text-left">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-left">
        {description}
      </p>
    </div>
  );
}

function SparkleIcon(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
    </svg>
  );
}
