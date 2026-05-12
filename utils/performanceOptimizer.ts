/**
 * Performance optimization utility for low-end devices
 * Automatically detects device capabilities and applies optimizations
 */

export interface PerformanceProfile {
  isLowEnd: boolean;
  disableAnimations: boolean;
  reduceParticles: boolean;
  disableFilters: boolean;
  reduceQuality: boolean;
  reduceFPS: boolean;
  lazyLoadImages: boolean;
  reduceCanvasQuality: boolean;
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
      reduceFPS: true,
      lazyLoadImages: true,
      reduceCanvasQuality: true,
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
      reduceFPS: false,
      lazyLoadImages: false,
      reduceCanvasQuality: false,
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
    reduceFPS: false,
    lazyLoadImages: false,
    reduceCanvasQuality: false,
  };

  // Check memory (if available)
  if ((navigator as any).deviceMemory) {
    const memory = (navigator as any).deviceMemory;
    profile.isLowEnd = memory < 4;
    if (memory < 2) {
      profile.reduceQuality = true;
      profile.reduceCanvasQuality = true;
    }
  }

  // Check connection (if available)
  if ((navigator as any).connection?.effectiveType) {
    const connection = (navigator as any).connection.effectiveType;
    if (connection === 'slow-2g' || connection === '2g' || connection === '3g') {
      profile.isLowEnd = true;
      profile.lazyLoadImages = true;
      profile.reduceQuality = true;
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
    profile.reduceFPS = true;
    profile.lazyLoadImages = true;
    profile.reduceCanvasQuality = true;
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

/**
 * Get animation duration multiplier for low-end devices
 */
export function getAnimationDuration(baseDuration: number): number {
  const profile = detectPerformanceProfile();
  if (profile.disableAnimations) return 0;
  if (profile.reduceFPS) return baseDuration * 1.5; // Longer durations, fewer frames
  return baseDuration;
}

/**
 * Get canvas quality scale for rendering
 */
export function getCanvasQualityScale(): number {
  const profile = detectPerformanceProfile();
  if (profile.reduceCanvasQuality) return 0.75; // 75% of full resolution
  if (profile.reduceQuality) return 0.85;
  return 1;
}

/**
 * Get target FPS for animations
 */
export function getTargetFPS(): number {
  const profile = detectPerformanceProfile();
  if (profile.reduceFPS) return 30; // Low-end: 30 FPS
  return 60; // Normal: 60 FPS
}

/**
 * Optimize image loading strategy
 */
export function shouldLazyLoadImage(): boolean {
  const profile = detectPerformanceProfile();
  return profile.lazyLoadImages;
}

/**
 * Get CSS filter optimization level
 */
export function getCSSFilters(): string {
  const profile = detectPerformanceProfile();
  if (profile.disableFilters) return 'none';
  if (profile.reduceQuality) return 'brightness(1) contrast(1)'; // Minimal filters
  return ''; // Full filters
}
