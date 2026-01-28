import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useKnowledgeGraph(documentId: number) {
  return useQuery({
    queryKey: [api.kg.get.path, documentId],
    queryFn: async () => {
      const url = buildUrl(api.kg.get.path, { id: documentId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch graph data");
      return api.kg.get.responses[200].parse(await res.json());
    },
    enabled: !!documentId,
  });
}
