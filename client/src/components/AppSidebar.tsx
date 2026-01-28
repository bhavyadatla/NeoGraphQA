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
  Plus,
  MoreVertical,
  Pencil,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Chat QA", icon: MessageSquare, href: "/chat" },
  { label: "Documents", icon: FileText, href: "/documents" },
  { label: "Knowledge Graph", icon: Network, href: "/kg" },
  { label: "Image Analysis", icon: ImageIcon, href: "/images" },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: conversations } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({ title: "Chat deleted" });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number, title: string }) => {
      await apiRequest("PATCH", `/api/conversations/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({ title: "Chat renamed" });
    },
  });

  const createChatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", { title: "New Chat" });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation(`/chat/${data.id}`);
      setOpen(false);
    }
  });

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
           <div className="px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
             History
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-4 w-4"
               onClick={() => createChatMutation.mutate()}
             >
               <Plus className="w-3 h-3" />
             </Button>
           </div>
           <div className="px-2 space-y-1">
             {conversations && conversations.length > 0 ? (
               conversations.map((chat) => (
                 <div key={chat.id} className="group relative">
                   <Link href={`/chat/${chat.id}`}>
                     <div
                       className={cn(
                         "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer truncate pr-8",
                         location === `/chat/${chat.id}` 
                           ? "bg-primary/10 text-primary font-medium" 
                           : "text-muted-foreground hover:bg-muted hover:text-foreground"
                       )}
                       onClick={() => setOpen(false)}
                     >
                       <MessageSquare className="w-3 h-3 shrink-0" />
                       <span className="truncate">{chat.title}</span>
                     </div>
                   </Link>
                   <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-6 w-6">
                           <MoreVertical className="w-3 h-3" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => {
                           const newTitle = prompt("Enter new title:", chat.title);
                           if (newTitle) renameMutation.mutate({ id: chat.id, title: newTitle });
                         }}>
                           <Pencil className="w-3 h-3 mr-2" />
                           Rename
                         </DropdownMenuItem>
                         <DropdownMenuItem 
                           className="text-destructive"
                           onClick={() => deleteMutation.mutate(chat.id)}
                         >
                           <Trash2 className="w-3 h-3 mr-2" />
                           Delete
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                 </div>
               ))
             ) : (
               <p className="px-3 text-[10px] text-muted-foreground italic py-2">No recent chats...</p>
             )}
           </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border/50 bg-sidebar/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-card border border-border/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.firstName?.[0].toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName || "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
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
