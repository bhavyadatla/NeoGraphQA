import { z } from 'zod';
import { insertDocumentSchema, documents, kgNodes, kgEdges } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents',
      responses: {
        200: z.array(z.custom<typeof documents.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/documents/upload',
      // Input is FormData, handled specially
      responses: {
        201: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/documents/:id',
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/documents/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    process: { // Trigger summarization and KG build
      method: 'POST' as const,
      path: '/api/documents/:id/process',
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    }
  },
  kg: {
    get: {
      method: 'GET' as const,
      path: '/api/documents/:id/kg',
      responses: {
        200: z.object({
          nodes: z.array(z.custom<typeof kgNodes.$inferSelect>()),
          edges: z.array(z.custom<typeof kgEdges.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    }
  },
  chat: {
    query: {
      method: 'POST' as const,
      path: '/api/chat/query',
      input: z.object({
        message: z.string(),
        mode: z.enum(['auto', 'pdf', 'kg', 'image']).default('auto'),
        conversationId: z.number().optional(),
        documentId: z.number().optional(), // Context doc
      }),
      responses: {
        200: z.object({
          response: z.string(),
          source: z.string().optional(),
          confidence: z.number().optional(),
          reasoning: z.string().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
