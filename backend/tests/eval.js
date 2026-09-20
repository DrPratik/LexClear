require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { analyzeFullLease } = require('../services/gemini');

const testCases = [
  { name: "Normal tenant-friendly clause", text: "Landlord is responsible for all structural repairs and regular maintenance." },
  { name: "Normal landlord-friendly clause", text: "Tenant must pay rent by the 5th of every month." },
  { name: "Clearly risky clause", text: "Tenant is responsible for all repairs regardless of cause, including structural repairs." },
  { name: "Ambiguous clause", text: "Tenant will maintain the premises in good condition." },
  { name: "Sole discretion", text: "Deposit deductions are determined at the sole discretion of the landlord." },
  { name: "Regardless of cause", text: "Tenant shall fix plumbing issues regardless of cause." },
  { name: "Early termination penalty", text: "Early termination requires a penalty equal to three months rent." },
  { name: "Deposit forfeiture", text: "Any breach of contract will result in forfeiture of the entire deposit." },
  { name: "Landlord access without notice", text: "Landlord may enter the premises at any time without prior notice." },
  { name: "Tenant caused damage only", text: "Tenant is only responsible for repairs caused by Tenant's negligence." },
  { name: "Landlord structural repair", text: "Landlord remains liable for all roof and structural defects." },
  { name: "Conflicting clauses", text: "1. Term is fixed for 11 months. \n\n 2. Landlord may terminate at any time with 7 days notice." },
  { name: "Missing information", text: "The security deposit shall be returned within a reasonable time." },
  { name: "Multiple financial penalties", text: "Late rent incurs a penalty of Rs. 1000 per day. Subletting incurs a fine of Rs. 50,000." },
  { name: "Same clause different wording", text: "The lessor holds the right to access the property at their absolute discretion at any hour." }
];

async function runEval() {
  console.log("Running Evaluation Suite...");
  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`\n--- Test Case ${i + 1}: ${test.name} ---`);
    try {
      const result = await analyzeFullLease(test.text);
      console.log(`Overall Risk: ${result.overall_risk.level} (Score: ${result.overall_risk.score})`);
      if (result.clauses && result.clauses.length > 0) {
        console.log(`Clause Risk: ${result.clauses[0].risk_level}`);
        console.log(`Explanation: ${result.clauses[0].explanation}`);
      }
      if (result.cross_clause_issues && result.cross_clause_issues.length > 0) {
        console.log(`Cross Clause: ${result.cross_clause_issues[0].issue_description}`);
      }
    } catch (e) {
      console.error(`Failed to analyze test ${test.name}:`, e.message);
    }
  }
}

runEval();
