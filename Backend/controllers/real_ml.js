/**
 * @fileoverview A lightweight, local "RealMLAnalyzer" that performs simple,
 * deterministic feature extraction and scoring for audio, video, and text inputs.
 *
 * Purpose:
 * - Provide a small, self-contained analyzer for development, testing, or as a
 *   fallback when a full ML backend is unavailable.
 * - Accepts base64-encoded blobs (audio/video) or plain text and returns
 *   readable score objects suitable for the rest of the TrueScope pipeline.
 *
 * Notes:
 * - This is intentionally simple and heuristic — not a replacement for production ML.
 * - Input for audio/video is expected to be a base64 string. If no input is provided,
 *   each method returns sensible defaults via helper getters.
 */

import fs from 'fs';

export class RealMLAnalyzer {
  /**
   * Analyze base64-encoded audio data and return basic audio-derived scores.
   *
   * @param {string|null|undefined} audioData - Base64 string containing audio bytes.
   *                                            If falsy, method returns default voice object.
   * @returns {Promise<Object>} Analysis result with pitchScore, toneScore, emotionalScore,
   *                            stressScore, confidence, and interpretation.
   *
   * @example
   * const analyzer = new RealMLAnalyzer();
   * const result = await analyzer.analyzeAudio(base64AudioString);
   */
  async analyzeAudio(audioData) {
    if (!audioData) return this.getDefaultVoice();
    
    const buffer = Buffer.from(audioData, 'base64');
    const duration = buffer.length / 44100;
    const rms = this.calculateRMS(buffer);
    const pitch = this.detectPitch(buffer);
    
    return {
      pitchScore: Math.round(pitch * 100),
      toneScore: Math.round(rms * 100),
      emotionalScore: Math.round((rms + pitch) * 50),
      stressScore: Math.round(duration * 10),
      confidence: Math.round(70 + rms * 20),
      interpretation: `Real audio: ${duration.toFixed(1)}s, RMS: ${rms.toFixed(2)}`
    };
  }

  /**
   * Analyze base64-encoded video (or image) data and return facial-related metrics.
   *
   * @param {string|null|undefined} videoData - Base64 string containing video/image bytes.
   *                                            If falsy, method returns default facial object.
   * @returns {Promise<Object>} Analysis result with microExpressions, eyeMovement,
   *                            headPoseStability, gazeStability, confidence, and interpretation.
   *
   * @example
   * const facial = await analyzer.analyzeVideo(base64VideoString);
   */
  async analyzeVideo(videoData) {
    if (!videoData) return this.getDefaultFacial();
    
    const buffer = Buffer.from(videoData, 'base64');
    const motion = this.detectMotion(buffer);
    const stability = this.calculateStability(buffer);
    
    return {
      microExpressions: motion > 0.5 ? 'High' : motion > 0.2 ? 'Medium' : 'Low',
      eyeMovement: motion > 0.6 ? 'Frequent' : 'Stable',
      headPoseStability: Math.round(stability * 100),
      gazeStability: Math.round(stability * 90),
      confidence: Math.round(60 + motion * 30),
      interpretation: `Real video: motion ${motion.toFixed(2)}, stability ${stability.toFixed(2)}`
    };
  }

  /**
   * Analyze plain text and return simple text-level metrics.
   *
   * @param {string|null|undefined} text - Input text. If falsy, returns default text object.
   * @returns {Promise<Object>} Analysis result with sentimentScore, consistencyScore,
   *                            complexityScore, contradictionScore, deceptionScore,
   *                            confidence, and interpretation.
   *
   * @example
   * const textResult = await analyzer.analyzeText("I feel great today.");
   */
  async analyzeText(text) {
    if (!text) return this.getDefaultText();
    
    const words = text.split(' ');
    const sentiment = this.calculateSentiment(text);
    const complexity = words.length / text.split('.').length;
    
    return {
      sentimentScore: Math.round(sentiment * 100 + 50),
      consistencyScore: Math.round(100 - (words.length / 10)),
      complexityScore: Math.round(complexity * 10),
      contradictionScore: Math.round(90),
      deceptionScore: Math.round(85),
      confidence: Math.round(75),
      interpretation: `Real text: ${words.length} words, sentiment ${sentiment.toFixed(2)}`
    };
  }

  /* ------------------------------------------------------------------ */
  /* Low-level signal helpers (heuristics / lightweight processing)      */
  /* ------------------------------------------------------------------ */

  /**
   * Calculate RMS (root mean square) of a buffer and normalize to 0-1.
   * @param {Buffer} buffer
   * @returns {number} normalized RMS (0-1)
   */
  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return buffer.length > 0 ? Math.sqrt(sum / buffer.length) / 255 : 0;
  }

  /**
   * Detect a gross "pitch" proxy by returning the max byte value normalized.
   * This is a very rough heuristic and not a pitch estimator.
   * @param {Buffer} buffer
   * @returns {number} normalized pitch proxy (0-1)
   */
  detectPitch(buffer) {
    let max = 0;
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] > max) max = buffer[i];
    }
    return buffer.length > 0 ? max / 255 : 0;
  }

  /**
   * Estimate motion by summing absolute differences between consecutive bytes,
   * then normalizing.
   * @param {Buffer} buffer
   * @returns {number} motion estimate (0-1)
   */
  detectMotion(buffer) {
    if (buffer.length < 2) return 0;
    let diff = 0;
    for (let i = 1; i < buffer.length; i++) {
      diff += Math.abs(buffer[i] - buffer[i-1]);
    }
    return diff / (buffer.length * 255);
  }

  /**
   * Calculate a naive "stability" metric by splitting buffer into chunks,
   * computing chunk averages and measuring deviation.
   * @param {Buffer} buffer
   * @returns {number} stability measure (0-1) where 1 is highly stable
   */
  calculateStability(buffer) {
    const chunks = Math.floor(buffer.length / 100);
    if (chunks <= 0) return 1; // default stable when too small
    let variance = 0;
    for (let i = 0; i < chunks; i++) {
      const chunk = buffer.slice(i * 100, (i + 1) * 100);
      const avg = chunk.reduce((a, b) => a + b, 0) / 100;
      variance += Math.abs(chunk[0] - avg);
    }
    return 1 - (variance / chunks / 255);
  }

  /**
   * Very small rule-based sentiment calculator.
   * Positive words increment, negative words decrement; result clamped to [-1, 1].
   * @param {string} text
   * @returns {number} sentiment score between -1 and 1
   */
  calculateSentiment(text) {
    const positive = ['good', 'great', 'excellent', 'amazing', 'love', 'happy'];
    const negative = ['bad', 'terrible', 'awful', 'hate', 'angry', 'sad'];
    const words = text.toLowerCase().split(' ');
    let score = 0;
    words.forEach(word => {
      if (positive.includes(word)) score += 0.2;
      if (negative.includes(word)) score -= 0.2;
    });
    return Math.max(-1, Math.min(1, score));
  }

  /* ------------------------------------------------------------------ */
  /* Default / fallback outputs                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Default voice analysis returned when audio is not provided.
   * @returns {Object}
   */
  getDefaultVoice() {
    return {
      pitchScore: 50, toneScore: 50, emotionalScore: 50, stressScore: 50,
      confidence: 50, interpretation: 'No audio data provided'
    };
  }

  /**
   * Default facial analysis returned when video is not provided.
   * @returns {Object}
   */
  getDefaultFacial() {
    return {
      microExpressions: 'Low', eyeMovement: 'Stable', headPoseStability: 80,
      gazeStability: 75, confidence: 50, interpretation: 'No video data provided'
    };
  }

  /**
   * Default text analysis returned when text is not provided.
   * @returns {Object}
   */
  getDefaultText() {
    return {
      sentimentScore: 50, consistencyScore: 70, complexityScore: 40,
      contradictionScore: 90, deceptionScore: 85, confidence: 60,
      interpretation: 'No text data provided'
    };
  }
}
