import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Network, 
  Image as ImageIcon, 
  LogOut,
  Menu,
  LayoutGrid,
  Clock,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Chat", icon: MessageSquare, href: "/chat" },
  { label: "PDF Studio", icon: FileText, href: "/pdf-studio" },
  { label: "Image Studio", icon: ImageIcon, href: "/images" },
  { label: "Knowledge Graph", icon: Network, href: "/kg" },
  { label: "My Account", icon: User, href: "/profile" },
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
        <div className="space-y-1">
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
      </nav>

      <div className="p-4 border-t border-border/50 bg-sidebar/50">
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
              <Menu className="w-5 h-5" />
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
