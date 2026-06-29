export class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Returns a pseudo-random float between 0 and 1
   * Uses a simple Linear Congruential Generator (LCG)
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat(min, max + 1));
  }

  // Helper to get a stable start location based on a hash
  nextCoord(base: number, variance: number): number {
      return base + this.nextFloat(-variance, variance);
  }
}

// Helper to create a unique numeric seed from strings
export const createSeed = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};