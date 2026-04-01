// Simple fuzzy matching utility for handling typos
export function findBestMatch(target: string, content: string): string | null {
  // Extract all text content from HTML
  const textContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
  const words = textContent.split(/\s+/).filter(word => word.length > 2);
  
  const targetWords = target.toLowerCase().split(/\s+/);
  
  // For single word targets
  if (targetWords.length === 1) {
    const targetWord = targetWords[0];
    
    for (const word of words) {
      if (calculateSimilarity(targetWord, word) > 0.7) {
        return findOriginalText(word, content);
      }
    }
  }
  
  // For multi-word targets, look for phrase matches
  const phrases = extractPhrases(textContent, targetWords.length);
  
  for (const phrase of phrases) {
    if (calculatePhraseSimilarity(target.toLowerCase(), phrase) > 0.7) {
      return findOriginalText(phrase, content);
    }
  }
  
  return null;
}

function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function calculatePhraseSimilarity(phrase1: string, phrase2: string): number {
  const words1 = phrase1.split(/\s+/);
  const words2 = phrase2.split(/\s+/);
  
  if (words1.length !== words2.length) return 0;
  
  let totalSimilarity = 0;
  for (let i = 0; i < words1.length; i++) {
    totalSimilarity += calculateSimilarity(words1[i], words2[i]);
  }
  
  return totalSimilarity / words1.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function extractPhrases(text: string, wordCount: number): string[] {
  const words = text.split(/\s+/);
  const phrases = [];
  
  for (let i = 0; i <= words.length - wordCount; i++) {
    phrases.push(words.slice(i, i + wordCount).join(' '));
  }
  
  return phrases;
}

function findOriginalText(matchedText: string, originalContent: string): string {
  // Find the original casing in the HTML content
  const regex = new RegExp(matchedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const match = originalContent.match(regex);
  return match ? match[0] : matchedText;
}