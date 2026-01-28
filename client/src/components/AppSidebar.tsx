import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Network, 
  Image as ImageIcon, 
  User,
  LogOut,
  History,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Chat QA", icon: MessageSquare, href: "/chat" },
  { label: "Documents", icon: FileText, href: "/documents" },
  { label: "Knowledge Graph", icon: Network, href: "/kg" },
  { label: "Image Analysis", icon: ImageIcon, href: "/images" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-border text-sidebar-foreground">
      <div className="p-6 border-b border-border/50">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent font-display">
          NeoGraphQA
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Multi-Modal Intelligence</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="space-y-1 mb-4">
          <p className="px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Menu</p>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer text-sm",
                  location === item.href
                    ? "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setOpen(false)}
              >
                <item.icon className={cn("w-4 h-4", location === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="pt-4 border-t border-border/50">
           <p className="px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
             History
             <History className="w-3 h-3" />
           </p>
           <div className="px-2 space-y-1">
             <Button variant="ghost" className="w-full justify-start text-xs font-normal h-8 px-2 text-muted-foreground italic">
                No recent chats...
             </Button>
           </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border/50 bg-sidebar/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-card border border-border/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.username?.[0].toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username || "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">Free Plan</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md bg-background">
              <Plus className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:flex w-72 flex-col fixed inset-y-0 z-50">
        <NavContent />
      </div>
    </>
  );
}
