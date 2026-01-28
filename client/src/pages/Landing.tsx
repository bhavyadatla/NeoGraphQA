import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Cpu, Network, FileText, LayoutDashboard } from "lucide-react";

export default function Landing() {
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
          <a href="/api/login">
            <Button className="font-semibold shadow-lg shadow-primary/20">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Abstract Background Blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] -z-10 animate-pulse delay-1000" />

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border text-sm font-medium text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SparkleIcon className="w-4 h-4 text-accent" />
            <span>Next-Generation Knowledge Analysis</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
            Unlock Intelligence from <br/>
            <span className="text-primary">Documents</span> & <span className="text-accent">Knowledge Graphs</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-900">
            A multi-modal platform that transforms PDFs, text, and images into a queryable knowledge base using advanced Graph RAG.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <a href="/api/login">
              <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl shadow-primary/20 transition-all hover:scale-105">
                Try for Free
              </Button>
            </a>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base backdrop-blur-sm">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={FileText}
            title="PDF & Text Analysis"
            description="Upload documents and instantly extract insights, summaries, and key entities using NLP."
          />
          <FeatureCard 
            icon={Network}
            title="Knowledge Graph"
            description="Visualize relationships between concepts automatically extracted from your data."
          />
          <FeatureCard 
            icon={Bot}
            title="Multi-Modal QA"
            description="Ask questions about your data with a ChatGPT-like interface powered by Graph RAG."
          />
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© 2024 NeoGraphQA. Built for the Future of AI.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold font-display mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
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
