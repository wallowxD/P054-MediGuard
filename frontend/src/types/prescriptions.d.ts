import type { components } from "@/lib/api/types.gen";

export {};

declare global {
  type IPrescriptionDrugCandidate = components["schemas"]["PrescriptionDrugCandidate"];
  type IPrescriptionDiseaseCandidate = components["schemas"]["PrescriptionDiseaseCandidate"];
  type IExtractedPrescriptionDrug = components["schemas"]["ExtractedPrescriptionDrug"];
  type IExtractedPrescriptionDisease = components["schemas"]["ExtractedPrescriptionDisease"];
  type IPrescriptionExtractionResponse = components["schemas"]["PrescriptionExtractionResponse"];
}
