import express from "express";
import type { Express } from "express";
import { attachRoutes } from "../server/routes";

let cachedApp: Express | null = null;

function getApp(): Express {
  if (cachedApp) return cachedApp;

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  attachRoutes(app);
  cachedApp = app;
  return app;
}

export default function handler(req: any, res: any) {
  const app = getApp();
  return (app as any)(req, res);
}
