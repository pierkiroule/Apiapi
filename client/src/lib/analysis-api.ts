import { apiRequest } from "./queryClient";
import { Analysis, InsertAnalysis } from "@shared/schema";

export async function createAnalysis(data: InsertAnalysis): Promise<Analysis> {
  const response = await apiRequest("POST", "/api/analyses", data);
  return response.json();
}

export async function getAnalyses(): Promise<Analysis[]> {
  const response = await apiRequest("GET", "/api/analyses");
  return response.json();
}

export async function getAnalysis(id: string): Promise<Analysis> {
  const response = await apiRequest("GET", `/api/analyses/${id}`);
  return response.json();
}

export async function deleteAnalysis(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/analyses/${id}`);
}
