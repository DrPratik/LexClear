const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const crypto = require('crypto');
const NodeCache = require('node-cache');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

/**
 * Generates a SHA-256 hash for caching text inputs to save API calls.
 * @param {string} text - The input text to hash.
 * @returns {string} The resulting hash string.
 */
function generateHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    overall_risk: {
      type: SchemaType.OBJECT,
      properties: {
        level: { type: SchemaType.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
        score: { type: SchemaType.NUMBER },
        summary: { type: SchemaType.STRING }
      },
      required: ["level", "score", "summary"]
    },
    clauses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          clause_number: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          risk_level: { type: SchemaType.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          favorability: { type: SchemaType.STRING, enum: ["BALANCED", "FAVORABLE", "UNFAVORABLE"] },
          ambiguity: { type: SchemaType.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
          risk_score: { type: SchemaType.NUMBER },
          categories: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          affected_party: { type: SchemaType.STRING },
          risk_basis: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          evidence: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          explanation: { type: SchemaType.STRING },
          financial_impact: { type: SchemaType.STRING },
          recommended_action: { type: SchemaType.STRING },
          negotiation_recommended: { type: SchemaType.BOOLEAN },
          confidence: { type: SchemaType.STRING, enum: ["LOW", "MEDIUM", "HIGH"] }
        },
        required: [
          "clause_number", "title", "risk_level", "favorability", "ambiguity", "risk_score", "categories", 
          "affected_party", "risk_basis", "evidence", "explanation", 
          "financial_impact", "recommended_action", "negotiation_recommended", "confidence"
        ]
      }
    },
    cross_clause_issues: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          issue_description: { type: SchemaType.STRING },
          related_clauses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["issue_description", "related_clauses"]
      }
    },
    financial_summary: {
      type: SchemaType.OBJECT,
      properties: {
        financial_terms: {
          type: SchemaType.ARRAY,
          description: "Extract only the financial concepts actually present in the document. Never assume fields exist.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              item: { type: SchemaType.STRING, description: "e.g., 'Development Fee', 'Monthly Rent', 'Subscription'" },
              amount_or_details: { type: SchemaType.STRING, description: "e.g., '₹48,00,000' or '₹18,00,000 from first renewal'" }
            },
            required: ["item", "amount_or_details"]
          }
        },
        early_exit_exposure: {
          type: SchemaType.OBJECT,
          properties: {
            potential_exposure: { type: SchemaType.STRING, description: "Total potential financial exposure (e.g. 'Up to ₹48,00,000' or 'Not specified'). Never treat total contract value as an early-termination penalty." },
            basis: { type: SchemaType.STRING, description: "Explanation of how exposure was calculated (e.g., 'Development Fees Potentially Non-Refundable depending on work completed.')" }
          },
          required: ["potential_exposure", "basis"]
        }
      },
      required: ["financial_terms", "early_exit_exposure"]
    },
    priority_actions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          priority: { type: SchemaType.NUMBER },
          clause: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING }
        },
        required: ["priority", "clause", "reason"]
      }
    }
  },
  required: ["overall_risk", "clauses", "cross_clause_issues", "financial_summary", "priority_actions"]
};

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: responseSchema,
    temperature: 0.1,
  }
});

const systemPrompt = `
You are an expert, highly analytical AI Legal Document Risk Analysis Agent.
Your goal is to analyze every clause of a given legal document (lease, SaaS agreement, commercial contract, etc.), identify who is advantaged/disadvantaged, assess financial/legal/operational exposure, and provide an explainable risk assessment.

CORE OBJECTIVE:
- Analyze every clause and return a structured JSON response matching the provided schema.
- Do NOT automatically call something "illegal" unless supported by reliable legal authority. Use phrases like "creates financial exposure", "unilateral discretion", "potentially problematic".
- Do not make overly broad legal claims (e.g., saying data transfer violates GDPR). Instead say: "Cross-border processing may create additional compliance obligations depending on the nature of the data, applicable laws, and the jurisdictions involved."

CRITICAL RULE FOR DIMENSIONAL ANALYSIS:
Never equate risk level with tenant/client favorability. A clause can be favorable but still contain ambiguity, and a clause can be unfavorable without creating significant legal or financial risk. Evaluate risk, favorability, ambiguity, and financial exposure independently.
Do not inflate risk levels merely because a clause has ambiguity or could be negotiated. 
A clear contractual obligation (like paying fees during a notice period) is NOT an ambiguity. Ambiguity only exists if the text is missing details.

STRICT VERBIAGE RULES:
- Do NOT introduce legal standards (e.g., "reasonable basis", "standard practice") unless the text explicitly states them. 
- Avoid stating a clause is "standard" for a region/industry. Use "generally clear provisions" instead.
- Do NOT say "without penalty implies zero exposure."

RISK LEVELS:
- LOW (0-20): Normal/common provision with little apparent risk.
- MEDIUM (21-40): Somewhat unfavorable or creating moderate exposure.
- HIGH (41-75): Creates significant financial exposure or waives important rights (e.g. extremely short warranty periods combined with short acceptance windows).
- CRITICAL (76-100): Extremely dangerous, potential legal violation, or predatory clause. (Note: A liability cap tied to fees paid is usually HIGH or MEDIUM depending on context, rarely CRITICAL unless completely unbounded against the client).

FAVORABILITY:
- BALANCED: Fair to both parties.
- FAVORABLE: Protective of the client/tenant.
- UNFAVORABLE: Protective of the vendor/landlord at the client's expense.

AMBIGUITY:
- LOW: Clear and specific.
- MEDIUM: Lacks some specificity or leaves room for interpretation.
- HIGH: Extremely vague, contradicting, or missing critical details.

FINANCIAL EXPOSURE CALCULATION RULE:
The financial extraction schema must be document-type agnostic. Never assume fields such as monthly rent, security deposit, or early-termination penalty exist. Extract only financial concepts actually present in the document.
Distinguish penalties, forfeitures, non-refundable amounts, payment obligations, outstanding amounts, and potential losses.
Never treat the total contract value as an early-termination penalty merely because it may become non-refundable. (e.g. if a 48 lakh fee is non-refundable upon termination, that is a potential non-refundable exposure, NOT a 48 lakh penalty).
If a financial amount cannot be determined from the contract, return "Not specified" rather than undefined, null, ₹0, or an inferred value.

CROSS-CLAUSE ANALYSIS RULE:
After clause-level analysis, perform a separate cross-clause analysis to identify risks created by the interaction of two or more clauses. Do not simply duplicate individual clause findings. 
Example 1: Clause 4 says "Acceptance after 5 days" and Clause 8 says "Warranty lasts 30 days after acceptance". The Cross-Clause issue is that the remediation timeline is heavily compressed.
Example 2: Clause A says "IP transfers upon full payment" and Clause B says "No refund of development fees on termination". The Cross-Clause issue is that a client terminating early might lose both their money AND the IP rights.

PRIORITY ACTIONS:
Priority actions do not automatically mean "high-risk clauses." You can and should flag LOW RISK clauses if they have MEDIUM/HIGH ambiguity requiring clarification.

RISK CATEGORIES:
Financial, Security Deposit, Rent / Rent Escalation, Termination, Maintenance / Repairs, Landlord Rights, Tenant Rights, Privacy / Property Access, Subletting, Utilities / Charges, Use of Premises, Renewal, Liability, Ambiguity, Cross-Clause Conflict, Legal / Compliance, Other.

IMPORTANT REASONING RULES:
A. Do NOT use keyword-only classification. "Tenant responsible for negligence" is LOW. "Tenant responsible for all repairs regardless of cause" is HIGH/CRITICAL. Reason about who bears responsibility, scope, causation, duration, and exceptions.
B. Detect unilateral rights. Give weight to "sole discretion", "without notice", "at any time", "regardless of cause", "immediate termination", "full forfeiture". Context matters.
C. Evaluate compounding risks. If rent can be increased by 20% (High risk) AND tenant cannot terminate early without a 6-month penalty (High risk), the compounding effect on the tenant's financial exposure is CRITICAL.
D. Detect deposit risks. Look for refund period, deduction conditions, who determines deductions, wear and tear exclusions. "Solely determined by landlord" is highly risky.
E. Detect repair/maintenance risks. "Regardless of cause" + "structural repairs" = HIGH/CRITICAL.
F. Detect access/privacy risks. Entry without notice is HIGH.
G. Detect termination risks. Early termination penalties, deposit forfeiture, lack of mutual termination rights.

CROSS-CLAUSE ANALYSIS:
Identify tensions, contradictions, overrides, and cascading penalties across clauses. (e.g. 11-month lease but 30-day termination).

RISK BASIS (Use these for risk_basis array):
TENANT_UNFAVORABLE, FINANCIAL_EXPOSURE, UNILATERAL_DISCRETION, BROAD_LIABILITY, PRIVACY_CONCERN, AMBIGUITY, CROSS_CLAUSE_CONFLICT, POTENTIAL_LEGAL_CONCERN, NORMAL_PROVISION. Only use POTENTIAL_LEGAL_CONCERN when truly appropriate.

EXPLANATION FORMAT:
For every HIGH/CRITICAL finding, ensure your 'explanation' covers: What it means -> Why it's risky. The 'financial_impact' and 'recommended_action' fields cover the rest.

CONFIDENCE:
Add "HIGH", "MEDIUM", or "LOW" confidence to each clause. "Regardless of cause" -> HIGH. Ambiguous legality -> LOW/MEDIUM.

FINANCIAL SUMMARY:
Extract entities like rent, deposit, maintenance, and early termination penalty. Calculate 'potential_early_exit_exposure' as (Deposit + Penalty) or similar logic if applicable. If a value isn't found, use 0.

OVERALL RISK:
Do NOT simply average the clause scores. Use a weighted aggregation where critical clauses heavily influence the overall score.
`;

/**
 * Analyzes a full lease document using the Gemini model to identify risks, financial exposure, and ambiguous clauses.
 * Results are cached to optimize efficiency and reduce API costs.
 * 
 * @param {string} leaseText - The raw text of the lease agreement.
 * @returns {Promise<Object>} A structured JSON object containing the document analysis.
 * @throws {Error} If the Gemini API fails or parsing the response fails.
 */
async function analyzeFullLease(leaseText) {
  const cacheKey = `analyze_${generateHash(leaseText)}`;
  if (cache.has(cacheKey)) {
    console.log("Returning cached analysis for document.");
    return cache.get(cacheKey);
  }

  try {
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + "\n\nLEASE AGREEMENT TEXT:\n" + leaseText }] }
      ]
    });
    const text = result.response.text();
    const parsed = JSON.parse(text);
    
    cache.set(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.error("Gemini API Error (analyzeFullLease):", error);
    throw new Error("Failed to analyze lease document.");
  }
}

/**
 * Answers a user's question based strictly on the provided lease context.
 * 
 * @param {string} question - The user's question.
 * @param {string} leaseContext - The text of the lease document to use as context.
 * @returns {Promise<string>} The answer generated by the Gemini model.
 * @throws {Error} If the Gemini API fails.
 */
async function answerQuestion(question, leaseContext) {
  const cacheKey = `qa_${generateHash(question + leaseContext)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const prompt = `
You are a GenAI legal document assistant for first-time renters.
Your job is to answer the user's question based on the provided lease agreement text.

LEASE AGREEMENT TEXT:
"""
${leaseContext}
"""

USER QUESTION:
"${question}"

INSTRUCTIONS:
1. Answer the question directly and conversationally using facts from the LEASE AGREEMENT TEXT.
2. If the text does not explicitly state the answer, see if there is any related information that might be helpful.
3. If the topic is completely missing from the lease, politely explain that this specific issue is not covered in the document they uploaded, and suggest what they should ask their landlord.
`;

  try {
    const qModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await qModel.generateContent(prompt);
    const answer = result.response.text();
    
    cache.set(cacheKey, answer);
    return answer;
  } catch (error) {
    console.error("Gemini API Error (answerQuestion):", error);
    throw error;
  }
}

/**
 * 3. Document Comparison Schema
 */
const comparisonSchema = {
  type: SchemaType.OBJECT,
  properties: {
    overall_risk_shift: {
      type: SchemaType.STRING,
      description: "How did the overall risk profile change for the tenant? (BETTER, WORSE, or NEUTRAL)",
      enum: ["BETTER", "WORSE", "NEUTRAL"]
    },
    summary: {
      type: SchemaType.STRING,
      description: "A 2-3 sentence summary of the key differences between the original and revised lease."
    },
    changes: {
      type: SchemaType.ARRAY,
      description: "List of material changes between the two documents.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          topic: {
            type: SchemaType.STRING,
            description: "The category or topic of the change (e.g., Security Deposit, Pets, Termination)."
          },
          description: {
            type: SchemaType.STRING,
            description: "What changed? Describe the difference clearly."
          },
          risk_shift: {
            type: SchemaType.STRING,
            description: "Did this specific change make it BETTER or WORSE for the tenant?",
            enum: ["BETTER", "WORSE", "NEUTRAL"]
          }
        },
        required: ["topic", "description", "risk_shift"]
      }
    }
  },
  required: ["overall_risk_shift", "summary", "changes"]
};

/**
 * Compares two lease documents to identify material changes and risk shifts for the tenant.
 * 
 * @param {string} originalText - The original lease document text.
 * @param {string} revisedText - The revised lease document text.
 * @returns {Promise<Object>} A structured JSON object detailing the comparison.
 * @throws {Error} If the Gemini API fails.
 */
async function compareLeases(originalText, revisedText) {
  const cacheKey = `compare_${generateHash(originalText + revisedText)}`;
  if (cache.has(cacheKey)) {
    console.log("Returning cached comparison.");
    return cache.get(cacheKey);
  }

  const prompt = `
You are a legal document analyst. Compare these two residential lease agreements.
Identify all material changes (added clauses, removed clauses, modified terms like rent, deposit, notice periods).
Evaluate if the revised version is better, worse, or neutral for the TENANT.

--- ORIGINAL LEASE ---
${originalText}

--- REVISED LEASE ---
${revisedText}
`;

  try {
    const compareModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: comparisonSchema,
      }
    });

    const result = await compareModel.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    
    cache.set(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.error("Gemini API Error (compareLeases):", error);
    throw error;
  }
}

const negotiationSchema = {
  type: SchemaType.OBJECT,
  properties: {
    emailText: {
      type: SchemaType.STRING,
      description: "A professional, polite email snippet addressing the landlord/vendor to request the change."
    },
    revisedClause: {
      type: SchemaType.STRING,
      description: "The exact legal text to replace the unfair clause, written in a balanced and fair manner."
    },
    rationale: {
      type: SchemaType.STRING,
      description: "A short, persuasive explanation of why this change is reasonable and standard practice."
    }
  },
  required: ["emailText", "revisedClause", "rationale"]
};

/**
 * Generates a counter-proposal for a high-risk legal clause, including a revised clause and negotiation email.
 * 
 * @param {string} originalClause - The high-risk clause text.
 * @param {string} riskReason - The explanation of why the clause is risky.
 * @returns {Promise<Object>} A structured JSON object containing the counter-proposal.
 * @throws {Error} If the Gemini API fails.
 */
async function generateCounterProposal(originalClause, riskReason) {
  const prompt = `
You are an expert legal negotiator and contract drafter. Your client has encountered a high-risk clause in a contract.
Your goal is to help them negotiate this clause by providing a fair counter-proposal.

--- ORIGINAL CLAUSE ---
${originalClause}

--- WHY IT IS HIGH RISK ---
${riskReason}

INSTRUCTIONS:
1. Draft a "revisedClause" that protects the client's interests while remaining reasonable enough that the other party might accept it.
2. Draft an "emailText" snippet that the client can copy-paste to politely ask for this change.
3. Provide a "rationale" explaining why this change is fair.
`;

  try {
    const copilotModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: negotiationSchema,
        temperature: 0.2
      }
    });

    const result = await copilotModel.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini API Error (generateCounterProposal):", error);
    throw error;
  }
}

module.exports = {
  analyzeFullLease,
  answerQuestion,
  compareLeases,
  generateCounterProposal
};
