import type { components } from "@/lib/api/types.gen";

export {};

declare global {
  type TSeverity = components["schemas"]["SeverityScaleItem"]["severity"];
  type TReviewStatus = "pending" | "approved" | "rejected";
  type TInteractionKind = components["schemas"]["InteractionItem"]["kind"];

  type ICitation = components["schemas"]["Citation"];
  type IAISummary = components["schemas"]["AISummary"];
  type IInteractionItem = components["schemas"]["InteractionItem"];
  type ISeverityScaleItem = components["schemas"]["SeverityScaleItem"];
  type IDiseaseItem = components["schemas"]["DiseaseResponse"];
  type IDiseaseSearchResponse = components["schemas"]["DiseaseSearchResponse"];
  type IDrugSnapshot = components["schemas"]["DrugSnapshot"];
  type IInteractionCheckRequest = components["schemas"]["InteractionCheckRequest"];
  type IInteractionCheckResponse = components["schemas"]["InteractionCheckResponse"];
  type IUnavailableResult = components["schemas"]["UnavailableResult"];
  type TUnavailableReason = IUnavailableResult["reason"];
  type IInteractionCheckSummaryItem = components["schemas"]["InteractionCheckSummary"];
  type IInteractionCheckListResponse = components["schemas"]["InteractionCheckListResponse"];
  type IInteractionCheckDetail = IInteractionCheckResponse;
  type IPatientCondition = components["schemas"]["PatientConditionResponse"];
  type TConditionCode = components["schemas"]["PatientConditionCreate"]["conditionCode"];
  type IHealthProfile = components["schemas"]["HealthProfileResponse"];
  type IHealthProfileUpdate = components["schemas"]["HealthProfileUpdate"];

  interface IInteractionsGetAllRequest extends IPaginatedRequest {
    severity?: TSeverity;
    reviewStatus?: TReviewStatus;
    kind?: TInteractionKind;
  }

  interface IInteractionsGetAllResponse {
    items: IInteractionItem[];
    metadata: IPaginationMetadata;
  }
}
