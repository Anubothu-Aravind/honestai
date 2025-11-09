/**
 * @fileoverview Controller module for multimodal analysis in the TrueScope project.
 * Handles voice, facial, text, and combined truth analysis using helper functions and
 * the RealMLAnalyzer class. Each exported function serves as an Express route handler.
 */

import { RealMLAnalyzer } from "./real_ml.js";
import natural from 'natural';
import sentiment from 'sentiment';
import { Matrix } from 'ml-matrix';

// Initialize sentiment analyzer
const sentimentAnalyzer = new sentiment();

/**
 * Clamps a numeric score between 0 and 100.
 * @param {number} score - The raw score to clamp.
 * @returns {number} A rounded value between 0 and 100.
 */
const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

/**
 * Generates a deterministic pseudo-random numeric value based on input text.
 * @param {string} input - Input string to hash.
 * @param {number} [base=0.5] - Fallback base value if no input is provided.
 * @returns {number} Normalized number between 0 and 1.
 */
const generateDeterministicValue = (input, base = 0.5) => {
  if (!input) return base;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483647;
};

const mlAnalyzer = new RealMLAnalyzer();

/**
 * Analyzes voice input using deterministic scoring and RealMLAnalyzer.
 * @async
 * @param {string} [audioData] - Base64 or URL reference to the audio file.
 * @param {string} [transcript] - Optional speech-to-text transcript.
 * @returns {Promise<Object>} Voice analysis result.
 * @throws {Error} If neither audioData nor transcript is provided.
 */
const analyzeVoiceHelper = async (audioData, transcript) => {
  try {
    if (!audioData && !transcript) throw new Error('Audio data or transcript required');
    const inputHash = generateDeterministicValue(transcript || audioData);

    // Deterministic feature generation (for fallback/testing)
    const pitchScore = clampScore(50 + (inputHash * 40 - 20));
    const toneScore = clampScore(60 + (inputHash * 30 - 15));
    const emotionalScore = clampScore(45 + (inputHash * 50 - 25));
    const stressScore = clampScore(30 + (inputHash * 40 - 20));
    const confidence = clampScore(70 + (inputHash * 20 - 10));

    return await mlAnalyzer.analyzeAudio(audioData);
  } catch (error) {
    console.error('Voice analysis error:', error);
    throw error;
  }
};

/**
 * Analyzes facial data from video or image sources.
 * @async
 * @param {string} [videoData] - Video file or base64-encoded video input.
 * @param {string} [imageData] - Image frame if video data is not available.
 * @returns {Promise<Object>} Facial analysis results.
 */
const analyzeFacialHelper = async (videoData, imageData) => {
  try {
    if (!videoData && !imageData) return await mlAnalyzer.analyzeVideo(null);

    const inputHash = generateDeterministicValue(videoData || imageData);

    const microExpressions = inputHash > 0.7 ? 'High' : inputHash > 0.4 ? 'Medium' : 'Low';
    const eyeMovement = inputHash > 0.6 ? 'Frequent' : inputHash > 0.3 ? 'Moderate' : 'Stable';
    const headPoseStability = clampScore(80 + (inputHash * 20 - 10));
    const gazeStability = clampScore(75 + (inputHash * 25 - 12));
    const confidence = clampScore(65 + (inputHash * 30 - 15));

    return await mlAnalyzer.analyzeVideo(videoData || imageData);
  } catch (error) {
    console.error('Facial analysis error:', error);
    throw error;
  }
};

/**
 * Performs linguistic and sentiment-based analysis of text input.
 * @async
 * @param {string} text - Input text to analyze.
 * @returns {Promise<Object>} Text analysis results including sentiment, complexity, and deception scores.
 * @throws {Error} If text input is missing or empty.
 */
const analyzeTextHelper = async (text) => {
  try {
    if (!text || text.trim().length === 0) throw new Error('Text content required');

    const sentimentResult = sentimentAnalyzer.analyze(text);
    const sentimentScore = clampScore(50 + (sentimentResult.score * 20));

    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    const complexityScore = clampScore(Math.min(avgWordsPerSentence * 8, 100));

    const uniqueWords = new Set(words);
    const vocabularyDiversity = clampScore((uniqueWords.size / words.length) * 100);
    const consistencyScore = clampScore(100 - (vocabularyDiversity * 0.3));

    const deceptionWords = ['actually', 'basically', 'honestly', 'literally', 'obviously'];
    const deceptionCount = words.filter(word => deceptionWords.includes(word)).length;
    const deceptionScore = clampScore(100 - (deceptionCount * 15));

    const contradictionWords = ['but', 'however', 'although', 'despite', 'nevertheless'];
    const contradictionCount = words.filter(word => contradictionWords.includes(word)).length;
    const contradictionScore = clampScore(100 - (contradictionCount * 10));

    const confidenceWords = ['definitely', 'certainly', 'absolutely', 'surely'];
    const confidenceCount = words.filter(word => confidenceWords.includes(word)).length;
    const confidence = clampScore(60 + (confidenceCount * 8));

    return await mlAnalyzer.analyzeText(text);
  } catch (error) {
    console.error('Text analysis error:', error);
    throw error;
  }
};

/**
 * Computes an overall truth score by combining voice, facial, and text analysis results.
 * @param {Object} [voiceResult] - Output of analyzeVoiceHelper.
 * @param {Object} [facialResult] - Output of analyzeFacialHelper.
 * @param {Object} [textResult] - Output of analyzeTextHelper.
 * @param {string} [transcript] - Optional transcript used for context.
 * @returns {Object} Truthfulness score, confidence level, and interpretation text.
 */
const computeTruthScoreHelper = (voiceResult, facialResult, textResult, transcript) => {
  try {
    if (!voiceResult && !facialResult && !textResult)
      throw new Error('At least one analysis result required');

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
    if (truthfulness >= 80)
      interpretation = 'High truthfulness indicators detected. Strong consistency across multiple analysis modalities.';
    else if (truthfulness >= 60)
      interpretation = 'Moderate truthfulness indicators. Some inconsistencies detected but overall credible.';
    else if (truthfulness >= 40)
      interpretation = 'Mixed signals detected. Some deception indicators present.';
    else
      interpretation = 'Low truthfulness indicators. Multiple deception signals detected.';

    return { truthfulness, confidence, interpretation };
  } catch (error) {
    console.error('Truth score computation error:', error);
    throw error;
  }
};

/**
 * @route POST /voice
 * @description Express route handler for voice analysis.
 */
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

/**
 * @route POST /facial
 * @description Express route handler for facial expression analysis.
 */
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

/**
 * @route POST /text
 * @description Express route handler for text-based analysis.
 */
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

/**
 * @route POST /truth
 * @description Combines multiple analysis results into a truth score.
 */
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

/**
 * @route POST /all
 * @description Performs complete multimodal analysis (voice, facial, text) and computes truth score.
 */
export const analyzeAll = async (req, res) => {
  try {
    const { audioData, videoData, imageData, transcript } = req.body;

    const voiceResult = await analyzeVoiceHelper(audioData, transcript);
    const facialResult = await analyzeFacialHelper(videoData, imageData);
    const textResult = await analyzeTextHelper(transcript || 'No transcript provided');

    const truthResult = computeTruthScoreHelper(voiceResult, facialResult, textResult, transcript);

    res.json({
      voice: voiceResult,
      facial: facialResult,
      text: textResult,
      truth: truthResult,
    });
  } catch (error) {
    console.error('Combined analysis error:', error);
    res.status(500).json({ error: 'Combined analysis failed' });
  }
};
