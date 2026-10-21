import * as db from "@/mocks/data";
import type {
  ActionCard,
  CustomerReview,
  DashboardSummary,
  Department,
  Employee,
  Integration,
  SentimentPoint,
} from "@/types";
import { mockResponse } from "./http";

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

export * from "./onboarding";

export const getSettings = () =>
  mockResponse<Record<string, unknown> | null>({ language: "tr", currency: "TRY" }, null);
