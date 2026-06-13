const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Simplified face recognition service.
 * For production use, install face-api.js + canvas:
 *   npm install face-api.js canvas
 * 
 * Current implementation uses a placeholder approach with
 * image hashing for basic face comparison.
 */

const MODEL_URL = path.join(__dirname, '../../models');

let modelsLoaded = false;

const loadModels = async () => {
  if (modelsLoaded) return true;
  
  // Check if face-api.js is available
  try {
    require.resolve('face-api.js');
    const faceapi = require('face-api.js');
    const canvas = require('canvas');
    
    const { Canvas, Image, ImageData, loadImage } = canvas;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    
    const modelPath = MODEL_URL;
    if (!fs.existsSync(modelPath)) {
      fs.mkdirSync(modelPath, { recursive: true });
    }
    
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    
    modelsLoaded = true;
    console.log('Face recognition models loaded successfully');
    return true;
  } catch (err) {
    console.warn('face-api.js not available. Using fallback face recognition.');
    console.warn('Install with: npm install face-api.js canvas');
    return false;
  }
};

const getFaceDescriptor = async (imagePath) => {
  try {
    const hasFaceApi = await loadModels();
    
    if (!fs.existsSync(imagePath)) {
      throw new Error('Image file not found');
    }
    
    if (hasFaceApi) {
      const faceapi = require('face-api.js');
      const { loadImage } = require('canvas');
      
      const img = await loadImage(imagePath);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detection) return null;
      return Array.from(detection.descriptor);
    }
    
    // Fallback: generate a hash-based descriptor from the image
    const imageBuffer = fs.readFileSync(imagePath);
    const processed = await sharp(imageBuffer)
      .resize(128, 128, { fit: 'cover' })
      .grayscale()
      .raw()
      .toBuffer();
    
    // Create a simple 64-element descriptor based on image blocks
    const descriptor = [];
    const blockSize = 16;
    for (let by = 0; by < 8; by++) {
      for (let bx = 0; bx < 8; bx++) {
        let sum = 0;
        let count = 0;
        for (let y = 0; y < blockSize; y++) {
          for (let x = 0; x < blockSize; x++) {
            const px = (by * blockSize + y) * 128 + (bx * blockSize + x);
            if (px < processed.length) {
              sum += processed[px];
              count++;
            }
          }
        }
        descriptor.push(sum / (count || 1) / 255);
      }
    }
    
    return descriptor;
  } catch (error) {
    console.error('Error getting face descriptor:', error.message);
    return null;
  }
};

const compareFaces = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return 0;
  }
  
  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < descriptor1.length; i++) {
    dotProduct += descriptor1[i] * descriptor2[i];
    norm1 += descriptor1[i] * descriptor1[i];
    norm2 += descriptor2[i] * descriptor2[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2) || 1);
  return Math.max(0, Math.min(1, similarity));
};

const findBestMatch = (faceDescriptor, storedEmbeddings, threshold = 0.6) => {
  let bestMatch = { studentId: null, confidence: 0 };
  
  for (const embedding of storedEmbeddings) {
    const similarity = compareFaces(faceDescriptor, embedding.descriptor);
    if (similarity > bestMatch.confidence) {
      bestMatch = { studentId: embedding.studentId, confidence: similarity };
    }
  }
  
  if (bestMatch.confidence < threshold) {
    return null;
  }
  
  return bestMatch;
};

module.exports = {
  loadModels,
  getFaceDescriptor,
  compareFaces,
  findBestMatch
};