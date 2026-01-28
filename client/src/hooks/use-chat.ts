import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type ChatInput = z.infer<typeof api.chat.query.input>;
type ChatResponse = z.infer<typeof api.chat.query.responses[200]>;

export function useChat() {
  const { toast } = useToast();

  return useMutation<ChatResponse, Error, ChatInput>({
    mutationFn: async (input) => {
      const res = await fetch(api.chat.query.path, {
        method: api.chat.query.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to get response");
      }
      
      return api.chat.query.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
