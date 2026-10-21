import * as db from "@/mocks/data";
import type {
  ActionCard,
  CreateEmployeeInviteInput,
  CustomerReview,
  DashboardSummary,
  Department,
  Employee,
  Integration,
  OnboardingInvite,
  SentimentPoint,
} from "@/types";
import { delay, mockResponse } from "./http";

export const getDashboardSummary = (): Promise<DashboardSummary | null> =>
  mockResponse<DashboardSummary | null>(db.dashboardSummary, null);

export const getActionCards = (): Promise<ActionCard[]> => mockResponse(db.actionCards, []);

export const getSentimentSeries = (): Promise<SentimentPoint[]> =>
  mockResponse(db.sentimentSeries, []);

export const getCustomerReviews = (): Promise<CustomerReview[]> =>
  mockResponse(db.customerReviews, []);

export const getEmployees = (): Promise<Employee[]> => mockResponse(db.employees, []);

export const getDepartments = (): Promise<Department[]> => mockResponse(db.departments, []);

export const getIntegrations = (): Promise<Integration[]> => mockResponse(db.integrations, []);

export const getOnboardingInvites = (): Promise<OnboardingInvite[]> =>
  mockResponse(db.onboardingInvites, []);

export const getOnboardingInvite = (id: string): Promise<OnboardingInvite | null> =>
  mockResponse(db.onboardingInvites.find((i) => i.id === id) ?? null, null);

export const getInviteByToken = (token: string): Promise<OnboardingInvite | null> =>
  mockResponse(db.onboardingInvites.find((i) => i.token === token) ?? null, null);

export async function createEmployeeInvite(
  input: CreateEmployeeInviteInput,
): Promise<OnboardingInvite> {
  await delay();
  const invite: OnboardingInvite = {
    ...input,
    id: `o${Date.now()}`,
    token: Math.random().toString(36).slice(2, 12),
    status: "gonderildi",
    progress: 0,
    createdAt: new Date().toISOString(),
  };
  db.onboardingInvites.push(invite);
  return invite;
}

export const getSettings = () =>
  mockResponse<Record<string, unknown> | null>({ language: "tr", currency: "TRY" }, null);
