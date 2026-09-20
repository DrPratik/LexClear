const express = require('express');
const router = express.Router();
const { analyzeFullLease, answerQuestion, generateCounterProposal, generateRevisedDocument } = require('../services/gemini');

// In-memory state
let currentLeaseText = "";
let currentAnalysis = null;

router.post('/analyze', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: "Valid lease text is required." });
  }
  if (text.length > 500000) {
    return res.status(400).json({ error: "Document text exceeds maximum length." });
  }
  
  currentLeaseText = text; // Save for Q&A

  try {
    const analysis = await analyzeFullLease(text);
    currentAnalysis = analysis;
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: "Analysis failed." });
  }
});

router.post('/ask', async (req, res) => {
  const { question, text } = req.body;
  
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: "Valid question is required." });
  }
  if (question.length > 1000) {
    return res.status(400).json({ error: "Question exceeds maximum length." });
  }

  // Use the text provided from the frontend, fallback to in-memory if empty
  const contextText = text || currentLeaseText;

  if (!contextText) {
    return res.status(400).json({ error: "Lease context is missing. Please analyze a document first." });
  }

  const answer = await answerQuestion(question, contextText);
  
  res.json({ 
    answer,
    cited_clauses: [] // Kept for frontend compatibility
  });
});

router.post('/compare', async (req, res) => {
  const { original, revised } = req.body;
  if (!original || !revised || typeof original !== 'string' || typeof revised !== 'string') {
    return res.status(400).json({ error: "Both valid original and revised text are required." });
  }
  if (original.length > 500000 || revised.length > 500000) {
    return res.status(400).json({ error: "Document text exceeds maximum length." });
  }

  try {
    const comparison = await require('../services/gemini').compareLeases(original, revised);
    res.json(comparison);
  } catch (err) {
    res.status(500).json({ error: "Comparison failed." });
  }
});

router.post('/negotiate', async (req, res) => {
  const { originalClause, riskReason } = req.body;
  if (!originalClause || !riskReason || typeof originalClause !== 'string' || typeof riskReason !== 'string') {
    return res.status(400).json({ error: "Valid original clause and risk reason are required." });
  }

  try {
    const proposal = await generateCounterProposal(originalClause, riskReason);
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate counter-proposal." });
  }
});
router.post('/revise', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: "Valid original lease text is required." });
  }

  try {
    const revisedText = await generateRevisedDocument(text);
    res.json({ revisedText });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate revised document." });
  }
});

module.exports = router;
