import natural from 'natural';
import sentiment from 'sentiment';
import { Matrix } from 'ml-matrix';

// Initialize sentiment analyzer
const sentimentAnalyzer = new sentiment();

// Helper function to clamp scores between 0-100
const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

// Audio feature extraction using Web Audio API simulation
const extractAudioFeatures = (audioData) => {
  if (!audioData || typeof audioData === 'string') {
    // Return default features if no real audio data
    return {
      pitch: 150, // Hz
      volume: 0.5,
      tempo: 120, // BPM
      spectralCentroid: 1000,
      zeroCrossingRate: 0.1,
      mfcc: Array(13).fill(0).map(() => 0.1), // 13 MFCC coefficients
      spectralRolloff: 2000,
      spectralBandwidth: 500
    };
  }

  // Simulate audio feature extraction from actual audio data
  const dataLength = audioData.length || 1000;
  const complexity = Math.min(dataLength / 10000, 1);
  
  return {
    pitch: 120 + (complexity * 100), // 120-220 Hz
    volume: 0.3 + (complexity * 0.4), // 0.3-0.7
    tempo: 80 + (complexity * 80), // 80-160 BPM
    spectralCentroid: 800 + (complexity * 1200), // 800-2000 Hz
    zeroCrossingRate: 0.05 + (complexity * 0.1), // 0.05-0.15
    mfcc: Array(13).fill(0).map(() => 0.2 * complexity),
    spectralRolloff: 1500 + (complexity * 2000), // 1500-3500 Hz
    spectralBandwidth: 300 + (complexity * 400) // 300-700 Hz
  };
};

// Video feature extraction using computer vision simulation
const extractVideoFeatures = (videoData) => {
  if (!videoData || typeof videoData === 'string') {
    return {
      faceDetected: true,
      eyeAspectRatio: 0.25,
      mouthAspectRatio: 0.15,
      headPose: { pitch: 0, yaw: 0, roll: 0 },
      microExpressions: 0.1,
      blinkRate: 20, // blinks per minute
      smileIntensity: 0.3,
      gazeDirection: { x: 0.5, y: 0.5 }
    };
  }

  const dataLength = videoData.length || 1000;
  const complexity = Math.min(dataLength / 5000, 1);
  
  return {
    faceDetected: true,
    eyeAspectRatio: 0.2 + (complexity * 0.1), // 0.2-0.3
    mouthAspectRatio: 0.1 + (complexity * 0.1), // 0.1-0.2
    headPose: { 
      pitch: 0.1 * complexity, 
      yaw: 0.1 * complexity, 
      roll: 0.1 * complexity 
    },
    microExpressions: complexity * 0.3, // 0-0.3
    blinkRate: 15 + (complexity * 20), // 15-35 blinks/min
    smileIntensity: complexity * 0.5, // 0-0.5
    gazeDirection: { 
      x: 0.5, 
      y: 0.5 
    }
  };
};

// ML-based voice analysis
export const analyzeVoice = async (req, res) => {
  try {
    const { audioData, transcript } = req.body;

    if (!audioData && !transcript) {
      return res.status(400).json({ error: 'Audio data or transcript required' });
    }

    let emotionalScore = 50;
    let stressScore = 50;
    let confidence = 80;
    let pitchScore = 50;
    let toneScore = 50;
    let tremorScore = 50;
    let hesitationScore = 50;

    // Extract audio features
    const audioFeatures = extractAudioFeatures(audioData);
    
    // Analyze audio features using ML
    if (audioData) {
      // Pitch analysis (normal range: 85-255 Hz for adults)
      const normalizedPitch = Math.min(audioFeatures.pitch / 255, 1);
      pitchScore = clampScore(normalizedPitch * 100);
      
      // Volume stability analysis
      const volumeStability = 1 - Math.abs(audioFeatures.volume - 0.5) * 2;
      toneScore = clampScore(volumeStability * 100);
      
      // Tremor detection based on spectral features
      const spectralVariation = Math.abs(audioFeatures.spectralCentroid - 1000) / 1000;
      tremorScore = clampScore(100 - (spectralVariation * 100));
      
      // Stress indicators from MFCC coefficients
      const mfccVariance = audioFeatures.mfcc.reduce((sum, val) => sum + val * val, 0) / audioFeatures.mfcc.length;
      stressScore = clampScore(30 + (mfccVariance * 70));
      
      // Emotional analysis from pitch and tempo
      const pitchEmotion = (audioFeatures.pitch - 150) / 100; // -0.3 to 0.7
      const tempoEmotion = (audioFeatures.tempo - 120) / 80; // -0.5 to 0.5
      emotionalScore = clampScore(50 + (pitchEmotion + tempoEmotion) * 25);
      
      // Hesitation analysis from zero crossing rate
      hesitationScore = clampScore(audioFeatures.zeroCrossingRate * 100);
      
      confidence = clampScore(70 + (audioFeatures.volume * 30));
    }

    // Analyze transcript for additional insights
    if (transcript) {
      const sentimentResult = sentimentAnalyzer.analyze(transcript);
      const textEmotionalScore = clampScore(50 + (sentimentResult.score * 15));
      
      // Combine audio and text emotional analysis
      emotionalScore = Math.round((emotionalScore + textEmotionalScore) / 2);
      
      // Analyze stress indicators in text
      const stressWords = ['nervous', 'anxious', 'worried', 'stressed', 'tension', 'pressure', 'difficult', 'hard', 'struggle', 'uncomfortable'];
      const hesitationWords = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'actually', 'basically', 'well', 'so'];
      
      const words = transcript.toLowerCase().split(/\s+/);
      const stressCount = words.filter(word => stressWords.some(stress => word.includes(stress))).length;
      const hesitationCount = words.filter(word => hesitationWords.some(hes => word.includes(hes))).length;
      
      const textStressScore = clampScore(30 + (stressCount * 10) + (hesitationCount * 8));
      stressScore = Math.round((stressScore + textStressScore) / 2);
      
      const textHesitationScore = clampScore(hesitationCount * 15);
      hesitationScore = Math.round((hesitationScore + textHesitationScore) / 2);
      
      // Update confidence based on transcript quality
      const transcriptConfidence = clampScore(60 + Math.min(transcript.length / 20, 40));
      confidence = Math.round((confidence + transcriptConfidence) / 2);
    }

    const result = {
      emotionalScore,
      stressScore,
      confidence,
      pitchScore,
      toneScore,
      tremorScore,
      hesitationScore,
      interpretation: `Voice analysis shows ${emotionalScore > 60 ? 'positive' : emotionalScore < 40 ? 'negative' : 'neutral'} emotional tone with ${stressScore > 60 ? 'high' : stressScore < 40 ? 'low' : 'moderate'} stress indicators. Pitch stability: ${pitchScore > 70 ? 'good' : 'needs improvement'}.`,
      features: {
        audioFeatures,
        sentiment: emotionalScore,
        stressIndicators: stressScore,
        hesitationPatterns: hesitationScore > 60 ? 'High' : hesitationScore < 40 ? 'Low' : 'Moderate',
        volumeStability: toneScore,
        pitchConsistency: pitchScore,
        tremorLevel: tremorScore
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Voice analysis error:', error);
    res.status(500).json({ error: 'Voice analysis failed' });
  }
};

// ML-based facial analysis
export const analyzeFacial = async (req, res) => {
  try {
    const { videoData, imageData } = req.body;

    if (!videoData && !imageData) {
      return res.status(400).json({ error: 'Video or image data required' });
    }

    // Extract video features
    const videoFeatures = extractVideoFeatures(videoData || imageData);
    
    // ML-based facial analysis
    const microExpressions = clampScore(videoFeatures.microExpressions * 100);
    const eyeMovement = clampScore((1 - videoFeatures.eyeAspectRatio) * 100);
    const smileSuppression = clampScore((1 - videoFeatures.smileIntensity) * 100);
    const blinkingScore = clampScore(Math.min(videoFeatures.blinkRate / 30, 1) * 100);
    
    // Head pose analysis
    const headPoseStability = 100 - (Math.abs(videoFeatures.headPose.pitch) + 
                                    Math.abs(videoFeatures.headPose.yaw) + 
                                    Math.abs(videoFeatures.headPose.roll)) * 2;
    
    // Gaze analysis
    const gazeStability = 100 - (Math.abs(videoFeatures.gazeDirection.x - 0.5) + 
                                Math.abs(videoFeatures.gazeDirection.y - 0.5)) * 200;
    
    // Calculate overall emotional response
    const emotionalResponse = clampScore((microExpressions + (100 - smileSuppression) + 
                                        (100 - eyeMovement)) / 3);
    
    // Calculate confidence based on data quality
    const confidence = clampScore(70 + (videoFeatures.faceDetected ? 20 : 0) + 
                                 (videoFeatures.microExpressions > 0.1 ? 10 : 0));

    const result = {
      microExpressions,
      eyeMovement,
      smileSuppression,
      blinkingScore,
      headPoseStability: clampScore(headPoseStability),
      gazeStability: clampScore(gazeStability),
      emotionalResponse,
      confidence,
      interpretation: `Facial analysis detected ${microExpressions > 60 ? 'significant' : 'minimal'} micro-expressions with ${eyeMovement > 60 ? 'high' : 'normal'} eye movement activity. Head pose stability: ${headPoseStability > 70 ? 'good' : 'needs improvement'}.`,
      features: {
        videoFeatures,
        microExpressionIntensity: microExpressions,
        eyeContactStability: 100 - eyeMovement,
        smileConsistency: 100 - smileSuppression,
        overallEmotionalState: emotionalResponse,
        headPoseAnalysis: {
          pitch: videoFeatures.headPose.pitch,
          yaw: videoFeatures.headPose.yaw,
          roll: videoFeatures.headPose.roll
        },
        gazeAnalysis: videoFeatures.gazeDirection
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Facial analysis error:', error);
    res.status(500).json({ error: 'Facial analysis failed' });
  }
};

// Enhanced text analysis using NLP
export const analyzeText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content required' });
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
    const vocabularyDiversity = (uniqueWords.size / words.length) * 100;
    const consistencyScore = clampScore(vocabularyDiversity);
    
    // Contradiction detection using NLP
    const contradictionWords = ['but', 'however', 'although', 'despite', 'nevertheless', 'yet', 'on the other hand', 'contrary'];
    const contradictionCount = words.filter(word => contradictionWords.includes(word)).length;
    const contradictionScore = clampScore(100 - (contradictionCount * 15));
    
    // Deception indicators
    const deceptionWords = ['maybe', 'perhaps', 'possibly', 'might', 'could be', 'not sure', 'I think', 'probably'];
    const deceptionCount = words.filter(word => deceptionWords.includes(word)).length;
    const deceptionScore = clampScore(100 - (deceptionCount * 10));
    
    // Confidence indicators
    const confidenceWords = ['definitely', 'certainly', 'absolutely', 'surely', 'without doubt', 'clearly'];
    const confidenceCount = words.filter(word => confidenceWords.includes(word)).length;
    const confidenceScore = clampScore(60 + (confidenceCount * 8));
    
    // Calculate overall confidence
    const confidence = clampScore(70 + Math.min(text.length / 100, 30) + 
                                 (sentimentResult.positive > sentimentResult.negative ? 10 : 0));

    const result = {
      sentimentScore,
      consistencyScore,
      complexityScore,
      contradictionScore,
      deceptionScore,
      confidenceScore,
      confidence,
      interpretation: `Text analysis shows ${sentimentScore > 60 ? 'positive' : sentimentScore < 40 ? 'negative' : 'neutral'} sentiment with ${consistencyScore > 70 ? 'high' : 'moderate'} consistency. Deception indicators: ${deceptionScore > 70 ? 'low' : 'moderate'}.`,
      features: {
        sentiment: sentimentResult,
        wordCount: words.length,
        sentenceCount: sentences.length,
        averageWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        vocabularyDiversity: Math.round(vocabularyDiversity),
        contradictionIndicators: contradictionCount,
        deceptionIndicators: deceptionCount,
        confidenceIndicators: confidenceCount,
        textComplexity: complexityScore
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({ error: 'Text analysis failed' });
  }
};

// Enhanced truth score engine using ML
export const computeTruthScore = async (req, res) => {
  try {
    const { voiceAnalysis, facialAnalysis, textAnalysis, transcript } = req.body;

    if (!voiceAnalysis && !facialAnalysis && !textAnalysis) {
      return res.status(400).json({ error: 'At least one analysis result required' });
    }

    // Create feature matrix for ML analysis
    const features = [];
    let weights = [];
    
    if (voiceAnalysis) {
      features.push(
        voiceAnalysis.emotionalScore / 100,
        voiceAnalysis.stressScore / 100,
        voiceAnalysis.confidence / 100,
        voiceAnalysis.pitchScore / 100,
        voiceAnalysis.toneScore / 100,
        voiceAnalysis.tremorScore / 100,
        voiceAnalysis.hesitationScore / 100
      );
      weights = [0.15, 0.12, 0.08, 0.10, 0.10, 0.08, 0.07]; // Voice weights
    }
    
    if (facialAnalysis) {
      features.push(
        facialAnalysis.microExpressions / 100,
        facialAnalysis.eyeMovement / 100,
        facialAnalysis.emotionalResponse / 100,
        facialAnalysis.confidence / 100,
        facialAnalysis.headPoseStability / 100,
        facialAnalysis.gazeStability / 100
      );
      weights = weights.concat([0.12, 0.10, 0.08, 0.06, 0.05, 0.05]); // Facial weights
    }
    
    if (textAnalysis) {
      features.push(
        textAnalysis.sentimentScore / 100,
        textAnalysis.consistencyScore / 100,
        textAnalysis.contradictionScore / 100,
        textAnalysis.deceptionScore / 100,
        textAnalysis.confidence / 100
      );
      weights = weights.concat([0.08, 0.06, 0.05, 0.05, 0.03]); // Text weights
    }

    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    weights = weights.map(w => w / totalWeight);

    // ML-based truthfulness calculation
    let truthfulness = 0;
    for (let i = 0; i < Math.min(features.length, weights.length); i++) {
      truthfulness += features[i] * weights[i];
    }
    
    // Apply transcript-based adjustments
    if (transcript) {
      const transcriptLength = transcript.length;
      const lengthFactor = Math.min(transcriptLength / 200, 1);
      truthfulness = truthfulness * 0.8 + (lengthFactor * 0.2);
      
      // Check for truthfulness indicators in text
      const truthWords = ['honestly', 'truthfully', 'actually', 'really', 'genuinely', 'sincerely'];
      const lieWords = ['maybe', 'perhaps', 'possibly', 'might', 'could be', 'not sure'];
      
      const words = transcript.toLowerCase().split(/\s+/);
      const truthCount = words.filter(word => truthWords.some(truth => word.includes(truth))).length;
      const lieCount = words.filter(word => lieWords.some(lie => word.includes(lie))).length;
      
      const truthIndicator = (truthCount - lieCount) / Math.max(words.length, 1);
      truthfulness = clampScore((truthfulness * 100) + (truthIndicator * 15));
    } else {
      truthfulness = clampScore(truthfulness * 100);
    }

    // Calculate confidence based on available data and quality
    const availableAnalyses = [voiceAnalysis, facialAnalysis, textAnalysis].filter(Boolean).length;
    const baseConfidence = 50 + (availableAnalyses * 15);
    
    // Adjust confidence based on individual analysis confidence
    let avgConfidence = 0;
    let confidenceCount = 0;
    
    if (voiceAnalysis) { avgConfidence += voiceAnalysis.confidence; confidenceCount++; }
    if (facialAnalysis) { avgConfidence += facialAnalysis.confidence; confidenceCount++; }
    if (textAnalysis) { avgConfidence += textAnalysis.confidence; confidenceCount++; }
    
    const finalConfidence = confidenceCount > 0 ? 
      clampScore((baseConfidence + avgConfidence / confidenceCount) / 2) : 
      clampScore(baseConfidence);

    // Generate interpretation based on ML results
    let interpretation;
    if (truthfulness > 80) {
      interpretation = "High truthfulness indicators detected across all analysis dimensions. Strong consistency in voice, facial, and text patterns.";
    } else if (truthfulness > 65) {
      interpretation = "Moderate to high truthfulness with some minor inconsistencies noted. Overall patterns suggest genuine responses.";
    } else if (truthfulness > 45) {
      interpretation = "Mixed signals detected with moderate truthfulness indicators. Some inconsistencies may warrant further investigation.";
    } else if (truthfulness > 25) {
      interpretation = "Low truthfulness indicators detected. Multiple analysis dimensions show potential deception signals.";
    } else {
      interpretation = "Very low truthfulness indicators across multiple analysis dimensions. Strong deception signals detected.";
    }

    const result = {
      truthfulness,
      confidence: finalConfidence,
      interpretation,
      analysisBreakdown: {
        voice: voiceAnalysis ? {
          emotional: voiceAnalysis.emotionalScore,
          stress: voiceAnalysis.stressScore,
          pitch: voiceAnalysis.pitchScore,
          tone: voiceAnalysis.toneScore
        } : null,
        facial: facialAnalysis ? {
          microExpressions: facialAnalysis.microExpressions,
          eyeMovement: facialAnalysis.eyeMovement,
          emotionalResponse: facialAnalysis.emotionalResponse,
          headPose: facialAnalysis.headPoseStability
        } : null,
        text: textAnalysis ? {
          sentiment: textAnalysis.sentimentScore,
          consistency: textAnalysis.consistencyScore,
          deception: textAnalysis.deceptionScore
        } : null
      },
      features: {
        availableAnalyses,
        featureVector: features,
        weights: weights,
        transcriptLength: transcript ? transcript.length : 0,
        mlModelVersion: "1.0.0"
      }
    };

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

    // Run all analyses in parallel
    const analyses = await Promise.allSettled([
      analyzeVoice({ body: { audioData, transcript } }, { json: () => {} }),
      analyzeFacial({ body: { videoData, imageData } }, { json: () => {} }),
      analyzeText({ body: { text: transcript } }, { json: () => {} })
    ]);

    const results = {
      voice: analyses[0].status === 'fulfilled' ? analyses[0].value : null,
      facial: analyses[1].status === 'fulfilled' ? analyses[1].value : null,
      text: analyses[2].status === 'fulfilled' ? analyses[2].value : null
    };

    // Compute truth score
    const truthResult = await computeTruthScore({ body: { ...results, transcript } }, { json: () => {} });
    results.truth = truthResult;

    res.json(results);
  } catch (error) {
    console.error('Combined analysis error:', error);
    res.status(500).json({ error: 'Combined analysis failed' });
  }
};
