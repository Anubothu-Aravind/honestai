import { RealMLAnalyzer } from "./real_ml.js";
import natural from 'natural';
import sentiment from 'sentiment';
import { Matrix } from 'ml-matrix';

// Initialize sentiment analyzer
const sentimentAnalyzer = new sentiment();

// Helper function to clamp scores between 0 and 100
const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

// Helper function to generate deterministic values based on input
const generateDeterministicValue = (input, base = 0.5) => {
  if (!input) return base;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
};

// Voice analysis helper function (no Express res object)
const mlAnalyzer = new RealMLAnalyzer();

const analyzeVoiceHelper = async (audioData, transcript) => {
  try {
    if (!audioData && !transcript) {
      throw new Error('Audio data or transcript required');
    }

    // Generate deterministic values based on input
    const inputHash = generateDeterministicValue(transcript || audioData);
    
    // Simulate voice analysis features (kept for determinism if needed)
    const pitchScore = clampScore(50 + (inputHash * 40 - 20));
    const toneScore = clampScore(60 + (inputHash * 30 - 15));
    const emotionalScore = clampScore(45 + (inputHash * 50 - 25));
    const stressScore = clampScore(30 + (inputHash * 40 - 20));
    const confidence = clampScore(70 + (inputHash * 20 - 10));

    // Use real analyzer
    return await mlAnalyzer.analyzeAudio(audioData);
  } catch (error) {
    console.error('Voice analysis error:', error);
    throw error;
  }
};

// Facial analysis helper function (no Express res object)
const analyzeFacialHelper = async (videoData, imageData) => {
  try {
    // If no inputs provided, return default facial analysis from real analyzer
    if (!videoData && !imageData) {
      return await mlAnalyzer.analyzeVideo(null);
    }

    // Generate deterministic values based on input
    const inputHash = generateDeterministicValue(videoData || imageData);
    
    // Simulate facial analysis features (kept for determinism if needed)
    const microExpressions = inputHash > 0.7 ? 'High' : inputHash > 0.4 ? 'Medium' : 'Low';
    const eyeMovement = inputHash > 0.6 ? 'Frequent' : inputHash > 0.3 ? 'Moderate' : 'Stable';
    const headPoseStability = clampScore(80 + (inputHash * 20 - 10));
    const gazeStability = clampScore(75 + (inputHash * 25 - 12));
    const confidence = clampScore(65 + (inputHash * 30 - 15));

    // Use real analyzer (video preferred, fallback to image data)
    return await mlAnalyzer.analyzeVideo(videoData || imageData);
  } catch (error) {
    console.error('Facial analysis error:', error);
    throw error;
  }
};

// Text analysis helper function (no Express res object)
const analyzeTextHelper = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text content required');
    }

    // Sentiment analysis
    const sentimentResult = sentimentAnalyzer.analyze(text);
    const sentimentScore = clampScore(50 + (sentimentResult.score * 20));
    
    // Text complexity analysis
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    const complexityScore = clampScore(Math.min(avgWordsPerSentence * 8, 100));
    
    // Consistency analysis
    const uniqueWords = new Set(words);
    const vocabularyDiversity = clampScore((uniqueWords.size / words.length) * 100);
    const consistencyScore = clampScore(100 - (vocabularyDiversity * 0.3));
    
    // Deception indicators
    const deceptionWords = ['actually', 'basically', 'honestly', 'literally', 'obviously'];
    const deceptionCount = words.filter(word => deceptionWords.includes(word)).length;
    const deceptionScore = clampScore(100 - (deceptionCount * 15));
    
    // Contradiction analysis
    const contradictionWords = ['but', 'however', 'although', 'despite', 'nevertheless'];
    const contradictionCount = words.filter(word => contradictionWords.includes(word)).length;
    const contradictionScore = clampScore(100 - (contradictionCount * 10));
    
    // Confidence indicators
    const confidenceWords = ['definitely', 'certainly', 'absolutely', 'surely'];
    const confidenceCount = words.filter(word => confidenceWords.includes(word)).length;
    const confidence = clampScore(60 + (confidenceCount * 8));
    
    // Use real analyzer
    return await mlAnalyzer.analyzeText(text);
  } catch (error) {
    console.error('Text analysis error:', error);
    throw error;
  }
};

// Truth score computation helper function (no Express res object)
const computeTruthScoreHelper = (voiceResult, facialResult, textResult, transcript) => {
  try {
    if (!voiceResult && !facialResult && !textResult) {
      throw new Error('At least one analysis result required');
    }

    // Weighted combination of different analysis results
    let totalScore = 0;
    let totalWeight = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    if (voiceResult) {
      const voiceWeight = 0.3;
      const voiceScore = (voiceResult.emotionalScore + voiceResult.stressScore) / 2;
      totalScore += voiceScore * voiceWeight;
      totalWeight += voiceWeight;
      confidenceSum += voiceResult.confidence;
      confidenceCount++;
    }

    if (facialResult) {
      const facialWeight = 0.3;
      const facialScore = (facialResult.headPoseStability + facialResult.gazeStability) / 2;
      totalScore += facialScore * facialWeight;
      totalWeight += facialWeight;
      confidenceSum += facialResult.confidence;
      confidenceCount++;
    }

    if (textResult) {
      const textWeight = 0.4;
      const textScore = (textResult.sentimentScore + textResult.consistencyScore + textResult.deceptionScore) / 3;
      totalScore += textScore * textWeight;
      totalWeight += textWeight;
      confidenceSum += textResult.confidence;
      confidenceCount++;
    }

    const truthfulness = clampScore(totalScore / totalWeight);
    const confidence = clampScore(confidenceSum / confidenceCount);

    let interpretation;
    if (truthfulness >= 80) {
      interpretation = 'High truthfulness indicators detected. Strong consistency across multiple analysis modalities.';
    } else if (truthfulness >= 60) {
      interpretation = 'Moderate truthfulness indicators. Some inconsistencies detected but overall credible.';
    } else if (truthfulness >= 40) {
      interpretation = 'Mixed signals detected. Some deception indicators present.';
    } else {
      interpretation = 'Low truthfulness indicators. Multiple deception signals detected.';
    }

    return { truthfulness, confidence, interpretation };
  } catch (error) {
    console.error('Truth score computation error:', error);
    throw error;
  }
};

// Express route handlers
export const analyzeVoice = async (req, res) => {
  try {
    const { audioData, transcript } = req.body;
    const result = await analyzeVoiceHelper(audioData, transcript);
    res.json(result);
  } catch (error) {
    console.error('Voice analysis error:', error);
    res.status(500).json({ error: 'Voice analysis failed' });
  }
};

export const analyzeFacial = async (req, res) => {
  try {
    const { videoData, imageData } = req.body;
    const result = await analyzeFacialHelper(videoData, imageData);
    res.json(result);
  } catch (error) {
    console.error('Facial analysis error:', error);
    res.status(500).json({ error: 'Facial analysis failed' });
  }
};

export const analyzeText = async (req, res) => {
  try {
    const { text } = req.body;
    const result = await analyzeTextHelper(text);
    res.json(result);
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({ error: 'Text analysis failed' });
  }
};

export const computeTruthScore = async (req, res) => {
  try {
    const { voice, facial, text, transcript } = req.body;
    const result = computeTruthScoreHelper(voice, facial, text, transcript);
    res.json(result);
  } catch (error) {
    console.error('Truth score computation error:', error);
    res.status(500).json({ error: 'Truth score computation failed' });
  }
};

// Combined analysis function
export const analyzeAll = async (req, res) => {
  try {
    const { audioData, videoData, imageData, transcript } = req.body;

    // Run all analyses using helper functions
    const voiceResult = await analyzeVoiceHelper(audioData, transcript);
    const facialResult = await analyzeFacialHelper(videoData, imageData);
    const textResult = await analyzeTextHelper(transcript || 'No transcript provided');

    // Compute truth score
    const truthResult = computeTruthScoreHelper(voiceResult, facialResult, textResult, transcript);

    const results = {
      voice: voiceResult,
      facial: facialResult,
      text: textResult,
      truth: truthResult
    };

    res.json(results);
  } catch (error) {
    console.error('Combined analysis error:', error);
    res.status(500).json({ error: 'Combined analysis failed' });
  }
};
