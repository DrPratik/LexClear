const request = require('supertest');
const app = require('../server');

// Mock the Gemini service to avoid hitting the real API during tests
jest.mock('../services/gemini', () => ({
  analyzeFullLease: jest.fn().mockResolvedValue({
    overall_risk: { level: "LOW", score: 10, summary: "Mock summary" },
    clauses: [],
    cross_clause_issues: [],
    financial_summary: { financial_terms: [], early_exit_exposure: { potential_exposure: "None", basis: "None" } },
    priority_actions: []
  }),
  answerQuestion: jest.fn().mockResolvedValue("Mock answer"),
  compareLeases: jest.fn().mockResolvedValue({
    overall_risk_shift: "NEUTRAL",
    summary: "Mock summary",
    changes: []
  }),
  generateCounterProposal: jest.fn().mockResolvedValue({
    emailText: "Mock email",
    revisedClause: "Mock revised clause",
    rationale: "Mock rationale"
  })
}));

describe('API Endpoints', () => {
  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  describe('POST /api/ask', () => {
    it('should return 400 if question is missing', async () => {
      const res = await request(app).post('/api/ask').send({ text: 'Context' });
      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 if context is missing', async () => {
      const res = await request(app).post('/api/ask').send({ question: 'What is the rent?' });
      expect(res.statusCode).toEqual(400);
    });

    it('should return answer for valid question and context', async () => {
      const res = await request(app).post('/api/ask').send({ question: 'Question?', text: 'Context' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('answer', 'Mock answer');
    });
  });

  describe('POST /api/analyze', () => {
    it('should return 400 if text is missing', async () => {
      const res = await request(app).post('/api/analyze').send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 if text is too long', async () => {
      const res = await request(app).post('/api/analyze').send({ text: 'a'.repeat(500001) });
      expect(res.statusCode).toEqual(400);
    });

    it('should return analysis data for valid text', async () => {
      const res = await request(app).post('/api/analyze').send({ text: 'Valid lease text.' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('overall_risk');
    });
  });

  describe('POST /api/compare', () => {
    it('should return 400 if missing original or revised', async () => {
      const res = await request(app).post('/api/compare').send({ original: 'Text' });
      expect(res.statusCode).toEqual(400);
    });

    it('should return comparison data for valid texts', async () => {
      const res = await request(app).post('/api/compare').send({ original: 'Text', revised: 'Text 2' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('overall_risk_shift');
    });
  });

  describe('POST /api/negotiate', () => {
    it('should return 400 if missing originalClause or riskReason', async () => {
      const res = await request(app).post('/api/negotiate').send({ originalClause: 'Text' });
      expect(res.statusCode).toEqual(400);
    });

    it('should return counter proposal data for valid request', async () => {
      const res = await request(app).post('/api/negotiate').send({ originalClause: 'Text', riskReason: 'Reason' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('emailText');
      expect(res.body).toHaveProperty('revisedClause');
      expect(res.body).toHaveProperty('rationale');
    });
  });
});
