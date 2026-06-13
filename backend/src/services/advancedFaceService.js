/**
 * Advanced Face Recognition Service
 * Provides: liveness detection, anti-spoofing, confidence scoring,
 * multi-face detection, face quality validation, photo attack detection
 */
const sharp = require('sharp');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class AdvancedFaceService {
  constructor() {
    this.confidenceThresholds = {
      HIGH: 0.85,
      MEDIUM: 0.70,
      LOW: 0.60,
      MINIMUM: 0.50
    };
    this.livenessThreshold = 0.65;
    this.qualityThreshold = 0.60;
  }

  /**
   * Analyze face quality from image
   */
  async analyzeFaceQuality(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = await sharp(imagePath).stats();
      
      const qualityScore = {
        sharpness: await this.calculateSharpness(imagePath),
        brightness: this.calculateBrightness(stats),
        contrast: this.calculateContrast(stats),
        resolution: this.calculateResolutionScore(metadata),
        faceSize: 1.0,
        overall: 0
      };

      qualityScore.overall = (
        qualityScore.sharpness * 0.3 +
        qualityScore.brightness * 0.2 +
        qualityScore.contrast * 0.15 +
        qualityScore.resolution * 0.2 +
        qualityScore.faceSize * 0.15
      );

      return qualityScore;
    } catch (error) {
      console.error('Face quality analysis error:', error.message);
      return { overall: 0, error: error.message };
    }
  }

  /**
   * Calculate image sharpness using Laplacian variance
   */
  async calculateSharpness(imagePath) {
    try {
      const buffer = await sharp(imagePath)
        .resize(256, 256, { fit: 'cover' })
        .grayscale()
        .raw()
        .toBuffer();

      let sum = 0;
      let count = 0;
      const width = 256;
      
      for (let y = 1; y < 255; y++) {
        for (let x = 1; x < 255; x++) {
          const idx = y * width + x;
          const laplacian = Math.abs(
            buffer[idx] * 4 -
            buffer[(y - 1) * width + x] -
            buffer[(y + 1) * width + x] -
            buffer[y * width + (x - 1)] -
            buffer[y * width + (x + 1)]
          );
          sum += laplacian;
          count++;
        }
      }

      const variance = sum / count;
      return Math.min(1, variance / 100);
    } catch {
      return 0.5;
    }
  }

  calculateBrightness(stats) {
    const mean = stats.channels[0].mean;
    const optimal = 128;
    const deviation = Math.abs(mean - optimal) / 128;
    return Math.max(0, 1 - deviation);
  }

  calculateContrast(stats) {
    const std = stats.channels[0].std;
    const optimalStd = 64;
    const deviation = Math.abs(std - optimalStd) / optimalStd;
    return Math.max(0, Math.min(1, 1 - deviation * 0.5));
  }

  calculateResolutionScore(metadata) {
    const pixels = (metadata.width || 0) * (metadata.height || 0);
    if (pixels >= 921600) return 1.0; // HD
    if (pixels >= 307200) return 0.8; // VGA
    if (pixels >= 76800) return 0.5;  // Low
    return 0.3;
  }

  /**
   * Detect photo attacks (printed photo, screen replay)
   */
  async detectPhotoAttack(imagePath) {
    const threats = {
      isPhotoAttack: false,
      confidence: 0,
      reasons: []
    };

    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = await sharp(imagePath).stats();

      // Check for moiré patterns (screen capture detection)
      const hasMoirePattern = await this.detectMoirePattern(imagePath);
      if (hasMoirePattern) {
        threats.isPhotoAttack = true;
        threats.confidence += 0.4;
        threats.reasons.push('Moiré pattern detected (possible screen capture)');
      }

      // Check for reflective glare
      const hasGlare = this.detectGlare(stats);
      if (hasGlare) {
        threats.isPhotoAttack = true;
        threats.confidence += 0.3;
        threats.reasons.push('Unusual glare pattern detected');
      }

      // Check for edge artifacts (printed photo)
      const edgeScore = await this.detectEdgeArtifacts(imagePath);
      if (edgeScore > 0.7) {
        threats.isPhotoAttack = true;
        threats.confidence += 0.3;
        threats.reasons.push('Printed photo artifacts detected');
      }

      threats.confidence = Math.min(1, threats.confidence);
      
      return threats;
    } catch (error) {
      console.error('Photo attack detection error:', error.message);
      return { isPhotoAttack: false, confidence: 0, reasons: [] };
    }
  }

  async detectMoirePattern(imagePath) {
    try {
      const buffer = await sharp(imagePath)
        .resize(128, 128, { fit: 'cover' })
        .grayscale()
        .raw()
        .toBuffer();

      // FFT-like analysis using gradient patterns
      let highFreqCount = 0;
      for (let i = 1; i < buffer.length - 1; i++) {
        const diff = Math.abs(buffer[i] - buffer[i - 1]);
        if (diff > 50) highFreqCount++;
      }

      const patternRatio = highFreqCount / buffer.length;
      return patternRatio > 0.05 && patternRatio < 0.15;
    } catch {
      return false;
    }
  }

  detectGlare(stats) {
    const max = stats.channels[0].max;
    const mean = stats.channels[0].mean;
    const glareRatio = max / (mean + 1);
    return glareRatio > 3.5;
  }

  async detectEdgeArtifacts(imagePath) {
    try {
      const buffer = await sharp(imagePath)
        .resize(64, 64, { fit: 'cover' })
        .grayscale()
        .raw()
        .toBuffer();

      let edgeCount = 0;
      const threshold = 30;
      
      for (let y = 1; y < 63; y++) {
        for (let x = 1; x < 63; x++) {
          const idx = y * 64 + x;
          const gradX = Math.abs(buffer[idx] - buffer[idx - 1]);
          const gradY = Math.abs(buffer[idx] - buffer[(y - 1) * 64 + x]);
          if (gradX > threshold || gradY > threshold) edgeCount++;
        }
      }

      return edgeCount / (62 * 62);
    } catch {
      return 0;
    }
  }

  /**
   * Liveness detection using facial movement analysis
   */
  async detectLiveness(imagePath, previousImagePath = null) {
    const result = {
      isLive: false,
      confidence: 0,
      checks: {}
    };

    try {
      // Check 1: Texture analysis (live skin vs printed)
      const textureScore = await this.analyzeSkinTexture(imagePath);
      result.checks.texture = textureScore;

      // Check 2: If previous frame exists, check for micro-movements
      if (previousImagePath && fs.existsSync(previousImagePath)) {
        const movementScore = await this.detectMicroMovements(imagePath, previousImagePath);
        result.checks.movement = movementScore;
      } else {
        result.checks.movement = 0.5;
      }

      // Check 3: Color analysis for live skin tones
      const colorScore = await this.analyzeSkinColor(imagePath);
      result.checks.color = colorScore;

      // Weighted average
      const weights = { texture: 0.4, movement: 0.35, color: 0.25 };
      result.confidence = (
        textureScore * weights.texture +
        result.checks.movement * weights.movement +
        colorScore * weights.color
      );

      result.isLive = result.confidence >= this.livenessThreshold;

      return result;
    } catch (error) {
      console.error('Liveness detection error:', error.message);
      return { isLive: false, confidence: 0, checks: {} };
    }
  }

  async analyzeSkinTexture(imagePath) {
    try {
      const buffer = await sharp(imagePath)
        .resize(64, 64, { fit: 'cover' })
        .grayscale()
        .raw()
        .toBuffer();

      // Calculate local binary pattern variance
      let variance = 0;
      for (let y = 1; y < 63; y++) {
        for (let x = 1; x < 63; x++) {
          const center = buffer[y * 64 + x];
          let pattern = 0;
          const neighbors = [
            [-1,-1], [-1,0], [-1,1],
            [0,-1],          [0,1],
            [1,-1],  [1,0],  [1,1]
          ];
          neighbors.forEach(([dy, dx], i) => {
            if (buffer[(y + dy) * 64 + (x + dx)] >= center) {
              pattern |= (1 << i);
            }
          });
          variance += pattern;
        }
      }

      const normalizedVariance = variance / (62 * 62 * 255);
      return Math.min(1, normalizedVariance * 2);
    } catch {
      return 0.5;
    }
  }

  async analyzeSkinColor(imagePath) {
    try {
      const stats = await sharp(imagePath).stats();
      const r = stats.channels[0].mean;
      const g = stats.channels[1].mean;
      const b = stats.channels[2].mean;

      // Skin color ranges (YCrCb analysis approximation)
      const isSkinTone = (
        r > 80 && r < 250 &&
        g > 40 && g < 230 &&
        b > 20 && b < 210 &&
        Math.abs(r - g) > 5 &&
        Math.abs(r - b) > 10
      );

      return isSkinTone ? 0.85 : 0.30;
    } catch {
      return 0.5;
    }
  }

  async detectMicroMovements(currentPath, previousPath) {
    try {
      const current = await sharp(currentPath)
        .resize(32, 32, { fit: 'cover' })
        .grayscale()
        .raw()
        .toBuffer();

      const previous = await sharp(previousPath)
        .resize(32, 32, { fit: 'cover' })
        .grayscale()
        .raw()
        .toBuffer();

      let diffSum = 0;
      for (let i = 0; i < current.length; i++) {
        diffSum += Math.abs(current[i] - previous[i]);
      }

      const avgDiff = diffSum / current.length;
      // Natural micro-movements produce small but detectable changes
      return avgDiff > 5 && avgDiff < 50 ? 0.8 : 0.3;
    } catch {
      return 0.5;
    }
  }

  /**
   * Multi-face detection from image
   */
  async detectMultipleFaces(imagePath) {
    try {
      const hasFaceApi = await this.checkFaceApiAvailable();
      
      if (hasFaceApi) {
        const faceapi = require('face-api.js');
        const { loadImage } = require('canvas');
        const img = await loadImage(imagePath);
        const detections = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        return detections.map(d => ({
          confidence: d.detection.score,
          box: d.detection.box,
          descriptor: Array.from(d.descriptor),
          landmarks: d.landmarks.positions
        }));
      }

      // Fallback: return single face assumption
      return [{ confidence: 0.5, detected: false }];
    } catch (error) {
      console.error('Multi-face detection error:', error.message);
      return [];
    }
  }

  async checkFaceApiAvailable() {
    try {
      require.resolve('face-api.js');
      require.resolve('canvas');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate enhanced confidence score
   */
  calculateEnhancedConfidence(similarity, qualityScore, livenessScore) {
    const baseConfidence = similarity;
    const qualityWeight = qualityScore > 0.7 ? 0.1 : -0.1;
    const livenessWeight = livenessScore > 0.7 ? 0.1 : -0.15;

    let finalConfidence = baseConfidence + qualityWeight + livenessWeight;
    finalConfidence = Math.max(0, Math.min(1, finalConfidence));

    return {
      confidence: finalConfidence,
      breakdown: {
        baseSimilarity: similarity,
        qualityScore,
        livenessScore,
        qualityAdjustment: qualityWeight,
        livenessAdjustment: livenessWeight
      },
      level: finalConfidence >= 0.85 ? 'HIGH' :
             finalConfidence >= 0.70 ? 'MEDIUM' :
             finalConfidence >= 0.50 ? 'LOW' : 'FAILED'
    };
  }

  /**
   * Validate face image quality before recognition
   */
  async validateFaceImage(imagePath) {
    const validation = {
      valid: false,
      scores: {},
      issues: []
    };

    try {
      // Check file exists and size
      if (!fs.existsSync(imagePath)) {
        validation.issues.push('Image file not found');
        return validation;
      }

      const stat = fs.statSync(imagePath);
      if (stat.size > 10 * 1024 * 1024) {
        validation.issues.push('Image too large (>10MB)');
      }
      if (stat.size < 1024) {
        validation.issues.push('Image too small');
      }

      // Analyze quality
      const quality = await this.analyzeFaceQuality(imagePath);
      validation.scores.quality = quality;

      if (quality.overall < 0.4) {
        validation.issues.push('Image quality too low');
      }

      // Check for photo attacks
      const attackCheck = await this.detectPhotoAttack(imagePath);
      validation.scores.photoAttack = attackCheck;

      if (attackCheck.isPhotoAttack && attackCheck.confidence > 0.6) {
        validation.issues.push('Photo attack detected');
      }

      validation.valid = validation.issues.length === 0;
      return validation;
    } catch (error) {
      validation.issues.push(error.message);
      return validation;
    }
  }

  /**
   * Check for duplicate attendance (time-based + location)
   */
  async checkDuplicateAttendance(studentId, sessionId, existingAttendanceModel) {
    try {
      const recentAttendance = await existingAttendanceModel.findOne({
        where: {
          studentId,
          sessionId
        }
      });

      if (recentAttendance) {
        return {
          isDuplicate: true,
          existingRecord: recentAttendance,
          message: 'Attendance already marked for this session'
        };
      }

      // Check for rapid re-attempts (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentAttempt = await existingAttendanceModel.findOne({
        where: {
          studentId,
          timestamp: { [require('sequelize').Op.gte]: fiveMinutesAgo }
        }
      });

      if (recentAttempt) {
        return {
          isDuplicate: true,
          existingRecord: recentAttempt,
          message: 'Attendance already marked recently'
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Duplicate check error:', error.message);
      return { isDuplicate: false, error: error.message };
    }
  }
}

module.exports = new AdvancedFaceService();