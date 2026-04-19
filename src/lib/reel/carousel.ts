/** Multi-slide carousel export for dense pañcāṅga templates (full 1080×1920 per slide). */

export function getCarouselSlideCount(reelType: string): number {
  switch (reelType) {
    case 'panchang_full':
      return 5
    case 'muhurta':
    case 'choghadiya':
    case 'nakshatra':
      return 4
    default:
      return 1
  }
}

export function isCarouselReelType(reelType: string): boolean {
  return getCarouselSlideCount(reelType) > 1
}
