const express = require('express');
const router = express.Router();
const { analyzeFullLease, answerQuestion, generateCounterProposal } = require('../services/gemini');

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
    console.error("Error analyzing lease:", err);
    res.status(500).json({ error: "Analysis failed." });
  }
});

router.post('/ask', async (req, res) => {
  const { question, text } = req.body;
  console.log("--- ASK ENDPOINT ---");
  console.log("Question:", question);
  console.log("Text length provided by frontend:", text ? text.length : 0);
  
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: "Valid question is required." });
  }
  if (question.length > 1000) {
    return res.status(400).json({ error: "Question exceeds maximum length." });
  }

  // Use the text provided from the frontend, fallback to in-memory if empty
  const contextText = text || currentLeaseText;
  console.log("Context text length used:", contextText ? contextText.length : 0);

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
    console.error("Error comparing leases:", err);
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
    console.error("Error generating counter-proposal:", err);
    res.status(500).json({ error: "Failed to generate counter-proposal." });
  }
});

module.exports = router;
