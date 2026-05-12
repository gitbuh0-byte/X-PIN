/**
 * Performance optimization utility for low-end devices
 */

export interface PerformanceProfile {
  isLowEnd: boolean;
  disableAnimations: boolean;
  reduceParticles: boolean;
  disableFilters: boolean;
  reduceQuality: boolean;
}

let cachedProfile: PerformanceProfile | null = null;

/**
 * Detect device performance tier based on hardware capabilities and localStorage preference
 */
export function detectPerformanceProfile(): PerformanceProfile {
  if (cachedProfile) return cachedProfile;

  // Check for manual override in localStorage
  const manualPreference = localStorage.getItem('xpin_performance_mode');
  if (manualPreference === 'low-end') {
    cachedProfile = {
      isLowEnd: true,
      disableAnimations: true,
      reduceParticles: true,
      disableFilters: true,
      reduceQuality: true,
    };
    return cachedProfile;
  }

  if (manualPreference === 'high-end') {
    cachedProfile = {
      isLowEnd: false,
      disableAnimations: false,
      reduceParticles: false,
      disableFilters: false,
      reduceQuality: false,
    };
    return cachedProfile;
  }

  // Auto-detect based on device capabilities
  const profile: PerformanceProfile = {
    isLowEnd: false,
    disableAnimations: false,
    reduceParticles: false,
    disableFilters: false,
    reduceQuality: false,
  };

  // Check memory (if available)
  if ((navigator as any).deviceMemory) {
    profile.isLowEnd = (navigator as any).deviceMemory < 4;
  }

  // Check connection (if available)
  if ((navigator as any).connection?.effectiveType) {
    const connection = (navigator as any).connection.effectiveType;
    if (connection === 'slow-2g' || connection === '2g' || connection === '3g') {
      profile.isLowEnd = true;
    }
  }

  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    profile.disableAnimations = true;
  }

  // Apply aggressive optimizations for low-end devices
  if (profile.isLowEnd) {
    profile.disableAnimations = true;
    profile.reduceParticles = true;
    profile.disableFilters = true;
    profile.reduceQuality = true;
  }

  cachedProfile = profile;
  return profile;
}

/**
 * Set manual performance preference
 */
export function setPerformanceMode(mode: 'auto' | 'low-end' | 'high-end'): void {
  cachedProfile = null; // Reset cache
  if (mode === 'auto') {
    localStorage.removeItem('xpin_performance_mode');
  } else {
    localStorage.setItem('xpin_performance_mode', mode);
  }
}

/**
 * Disable animations via CSS for better performance
 */
export function disableAnimationsGlobally(): void {
  const styleId = 'xpin-disable-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      * {
        animation: none !important;
        transition: none !important;
      }
      @keyframes none {
        to { }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Reduce particle effects count
 */
export function getParticleCount(baseCount: number): number {
  const profile = detectPerformanceProfile();
  if (profile.reduceParticles) {
    return Math.ceil(baseCount / 2);
  }
  return baseCount;
}

/**
 * Check if we should render a component for performance
 */
export function shouldRenderComponent(componentName: string): boolean {
  const profile = detectPerformanceProfile();
  
  // Always render critical components
  const criticalComponents = ['wheel', 'game', 'ui'];
  if (criticalComponents.some(c => componentName.includes(c))) {
    return true;
  }

  // Disable non-essential animations and effects on low-end devices
  const optionalComponents = ['particles', 'confetti', 'animation'];
  if (optionalComponents.some(c => componentName.includes(c))) {
    return !profile.isLowEnd;
  }

  return true;
}
