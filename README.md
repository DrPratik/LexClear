# LexClear AI: Deep Semantic Document Risk Analysis

LexClear AI is a GenAI-powered solution designed to make legal information and basic legal assistance more accessible. By helping users understand, compare, and navigate legal documents (such as lease agreements, SaaS contracts, and employment agreements), LexClear bridges the gap between complex legal jargon and plain English comprehension.

*Note: LexClear provides information and assistance, rather than replacing professional legal advice.*

---

## 1. Chosen Vertical
**Legal & Compliance (Access to Justice)**
Navigating contracts is incredibly difficult for individuals without a legal background. LexClear targets the "Legal Tech / Access to Justice" vertical by empowering consumers (like first-time renters, freelancers, or small business owners) to instantly understand their legal exposure before signing a document.

## 2. Approach and Logic
LexClear employs a **Dimensional Analysis** approach to legal document review, powered by Google's **Gemini 2.5 Flash** model. 

Instead of a simple generic summary, the AI strictly evaluates clauses across multiple distinct dimensions using structured JSON schemas:
- **Risk Level**: (Low, Medium, High, Critical) Does this clause create financial or legal exposure?
- **Favorability**: (Balanced, Favorable, Unfavorable) Who benefits from this clause?
- **Ambiguity**: (Low, Medium, High) Is the clause vague or missing critical details?
- **Cross-Clause Analysis**: Does Clause A conflict with Clause B?

**The Logic:**
The backend prompts Gemini with strict rules (e.g., "Never equate risk level with tenant favorability. A clause can be favorable but ambiguous"). The AI acts as an analytical engine, strictly extracting financial obligations, computing potential early-exit exposure, and mapping risks to specific clauses. A caching layer (`node-cache`) is implemented to memoize results based on document hashes, optimizing efficiency and reducing API costs.

## 3. How the Solution Works

### Architecture
- **Frontend (React + Vite)**: Provides a responsive, accessible dashboard. It includes color-coded risk cards, a detailed financial breakdown, and a real-time Q&A chat interface. Optimized with `React.memo` for rendering efficiency.
- **Backend (Node.js + Express)**: Secured with `helmet`, `express-rate-limit`, and strict CORS policies. It handles input validation and securely orchestrates requests to the Gemini API.
- **AI Engine (Google Gemini 2.5 Flash)**: Handles complex reasoning, entity extraction (financials), and grounded Q&A.

### Key Features
1. **Deep Semantic Analysis**: Upload a document and receive a structured breakdown of every clause, color-coded by risk.
2. **Financial Summary**: Automatically extracts hidden fees, deposit rules, and calculates total potential early-exit exposure.
3. **Compare Versions**: Paste an original and a revised contract. LexClear highlights material changes and determines the "Risk Shift" (Better, Worse, or Neutral).
4. **Grounded Q&A**: Chat with your contract. The AI restricts its answers strictly to the uploaded context to prevent hallucinations.
5. **Lawyer Export**: Generates a clean text summary of the highest-risk issues to save billable hours when consulting a real attorney.

## 4. Assumptions Made
- **Language**: Documents analyzed are primarily in English and adhere to common law or standard commercial contract structures.
- **Input Format**: Users have already extracted the text from their PDFs/Word documents. (OCR/File parsing is assumed to be handled prior to pasting into LexClear).
- **Scope limitation**: The tool is an assistant for risk identification, assuming the user understands it does not constitute a legally binding audit.

---

## Evaluation Criteria Addressed
- **Code Quality**: Structured backend routes, component-based frontend, and comprehensive JSDoc comments.
- **Security**: Implemented Helmet (HTTP headers), Express Rate Limiting (DDoS protection), strict CORS, and input sanitization (length & type checks).
- **Efficiency**: Integrated LRU in-memory caching (`node-cache`) hashing document texts to prevent redundant expensive API calls. React rendering optimizations.
- **Testing**: Automated backend testing suite using `Jest` and `Supertest` validating all API endpoints.
- **Accessibility**: Semantic HTML, high contrast ratios, `aria-labels` on interactive elements, and `aria-live` regions for dynamic loading states.

## Setup Instructions

### Backend
1. `cd backend`
2. `npm install`
3. Create a `.env` file with `GEMINI_API_KEY=your_key_here` and `FRONTEND_URL=http://localhost:5173`
4. `npm start` (or `npm test` to run the test suite)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
