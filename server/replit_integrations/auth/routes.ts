import type { Express } from "express";
import { isAuthenticated } from "./customAuth";

// Register auth-specific routes (most routes are already in customAuth.ts)
export function registerAuthRoutes(app: Express): void {
  // Additional auth routes can be added here if needed
}
