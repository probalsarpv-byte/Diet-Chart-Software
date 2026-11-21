# SHUDDHO — Future AI & Mobile Architecture Contracts

**Document Code:** SHUDDHO-DOC-FAM-009  
**Version:** 1.0.0-R0  
**Phase:** R0 Architecture Baseline  
**Execution Target:** Phase R14 (AI Intelligence Layer) & Phase R15 (Native Android/iOS)  
**Current Operational Status:** **STRICTLY DEFERRED / ZERO RUNTIME INFERENCE IN R0**  

---

## 1. Architectural Philosophy: The Supervised AI Contract

SHUDDHO adheres to the **Human-in-the-Loop Clinical Supervisor Standard** (FDA Software as a Medical Device - SaMD Guidelines):
1. **No Autonomous Clinical Actions:** AI models may never directly modify patient records, recalculate diets without supervision, or approve clinical prescriptions.
2. **Deterministic Safety Sandbox:** Every AI-generated suggestion must pass through the deterministic TypeScript clinical safety engine (`F01`) before it can even be presented to a human practitioner.
3. **Draft-Only Staging:** AI outputs are permanently tagged with `is_ai_draft: true` and require biometric/credential sign-off by a registered clinician before becoming active.
4. **Zero Vendor Lock-In:** Core engines interact with AI through abstract provider adapters (`IAIProviderAdapter`), ensuring full compatibility with open-source local models (Llama 3, Mistral) and zero mandatory dependencies on proprietary paid APIs.

---

## 2. Future AI Interface Contracts (Phase R14 Target)

```
[Smartphone Camera / Voice Input]
             │
             ▼
[Abstract Provider Adapter (IAIProviderAdapter)]
             │
             ▼
[JSON Schema Validator (Strict Typing)]
             │
             ▼
[Tier 1 & Tier 2 Deterministic Safety Gate (F01)]
             │
             ├──► REJECT (Violates BMR / Allergies / DNI)
             │
             ▼ PASS
[Clinician Review & Acceptance Staging Queue]
             │
             ▼ (Clinician Explicit Acceptance)
[Active Clinical Chart]
```

### 2.1 Abstract AI Provider Adapter (`IAIProviderAdapter`)
```typescript
export interface IAIProviderAdapter {
  providerName: string; // e.g. "Local_Ollama_Mistral", "HuggingFace_Endpoint"
  isAvailable(): Promise<boolean>;
  generateStructuredSuggestion<T>(
    promptContext: string,
    schemaValidator: (obj: any) => obj is T
  ): Promise<{
    suggestion: T | null;
    rawText: string;
    modelConfidence: number;
    latencyMs: number;
  }>;
}
```

### 2.2 Food Photo Analyzer Interface (`IFoodPhotoAnalyzerAdapter` - U27)
```typescript
export interface IFoodPhotoAnalyzerAdapter {
  analyzeMealImage(imageBuffer: ArrayBuffer): Promise<{
    detectedItems: Array<{
      foodIdCandidate: string; // Mapped to Bangladesh FCTB ID
      detectedNameBn: string;
      detectedNameEn: string;
      estimatedVolumeCm3: number;
      estimatedGrams: number;
      confidence: number; // 0.00 to 1.00
    }>;
    isProcessedByClinician: false;
  }>;
}
```

### 2.3 Bengali Voice Food Diary Interface (`IBengaliVoiceDiaryAdapter` - U28)
```typescript
export interface IBengaliVoiceDiaryAdapter {
  transcribeBengaliAudio(audioChunk: Blob): Promise<{
    rawTranscriptBn: string;
    normalizedFoodEntries: Array<{
      foodId: string;
      householdPortionMentioned: string; // e.g. "১ বাটি"
      estimatedGrams: number;
      mealTimeCandidate: string;
    }>;
  }>;
}
```

### 2.4 Clinical Copilot Literature Assistant (`IClinicalCopilotAdapter` - U29)
```typescript
export interface IClinicalCopilotAdapter {
  synthesizeLiteratureSummary(
    clinicalHypothesis: string,
    biomarkers: Record<string, number>
  ): Promise<{
    clinicalSummary: string;
    groundedPmidList: string[];
    suggestedNutraceuticals: Array<{
      compound: string;
      suggestedDose: string;
      contraindicationsNoted: string[];
    }>;
    disclaimer: "ADVISORY ONLY. MANDATORY CLINICIAN INDEPENDENT VERIFICATION.";
  }>;
}
```

---

## 3. Future Mobile Companion Architecture (Phase R15 Target)

```
+---------------------------------------------------------------------------------------------------+
|                                 NATIVE MOBILE ARCHITECTURE (R15)                                  |
+---------------------------------------------------------------------------------------------------+
| PLATFORMS: iOS (Swift / SwiftUI) and Android (Kotlin / Jetpack Compose) or High-Performance React |
| Native / Capacitor Shell sharing TypeScript Business Logic.                                      |
+---------------------------------------------------------------------------------------------------+
| OFFLINE-FIRST SYNCHRONIZATION:                                                                    |
| • Encrypted SQLite Database on Device (SQLCipher with AES-256)                                    |
| • Conflict-Free Replicated Data Type (CRDT) Delta Engine                                          |
| • Background Synchronization Worker when cellular / WiFi connectivity restores                   |
+---------------------------------------------------------------------------------------------------+
| SECURITY & AUTHENTICATION:                                                                        |
| • Hardware Enclave / KeyStore Biometric Authentication (FaceID / Fingerprint)                     |
| • OAuth2 + PKCE Token Refresh Pipeline                                                            |
| • Strict Data Projection: Never receives or caches raw calories or macronutrient calculations (U21)|
+---------------------------------------------------------------------------------------------------+
| CHRONOTHERAPY PUSH NOTIFICATIONS:                                                                 |
| • Localized Push Notification Service (APNs / FCM)                                                |
| • Triggers meal completion reminders 3h prior to sleep (Cluster 5 Insomnia rule)                  |
| • Triggers thyroid medicine alerts 2h separated from calcium/iron meals                           |
+---------------------------------------------------------------------------------------------------+
```

### Mobile Authentication Contract (`IMobileAuthClient`)
```typescript
export interface IMobileAuthClient {
  authenticateBiometric(): Promise<{
    accessToken: string;
    patientId: string;
    sessionExpiresAt: string;
  }>;
  syncOfflineMealLog(pendingEntries: any[]): Promise<{
    syncedCount: number;
    failedCount: number;
  }>;
}
```

---

## 4. Current Phase R0 Invariant Declaration

- **Zero AI API calls exist in the current application.**
- **Zero native mobile binary projects exist in the current repository.**
- **All future AI and mobile capabilities are bounded strictly to architectural contracts, interface typings, and progressive web application (PWA) readiness.**
