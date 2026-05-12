import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { soundManager } from '../services/soundManager.ts';
import { COLOR_HEX } from '../constants.ts';
import { detectPerformanceProfile } from '../utils/performanceOptimizer.ts';

interface SpinWheelProps {
  spinning: boolean;
  targetIndex: number; 
  onSpinEnd: () => void;
  segments: { label: string; color: string; value: number }[];
  themeColor?: string;
  playerColor?: string;
}

const SpinWheel: React.FC<SpinWheelProps> = ({ spinning, targetIndex, onSpinEnd, segments, themeColor = 'neon-gold', playerColor = '' }) => {
  const wheelGroupRef = useRef<SVGGElement>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const spinInProgressRef = useRef(false);
  
  const sliceAngle = useMemo(() => 360 / (segments.length || 1), [segments.length]);

  // Add CSS animations for player color pulsing
  useEffect(() => {
    const styleId = 'player-color-pulse';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes playerPulse {
          0%, 100% {
            stroke-width: 8px;
            opacity: 1;
            filter: drop-shadow(0 0 15px currentColor) brightness(1);
          }
          50% {
            stroke-width: 14px;
            opacity: 1;
            filter: drop-shadow(0 0 40px currentColor) brightness(1.6);
          }
        }
        .player-color-pulse {
          animation: playerPulse 1.5s ease-in-out infinite !important;
        }
        .player-segment-pulse {
          animation: playerSegmentPulse 1.5s ease-in-out infinite !important;
        }
        @keyframes playerSegmentPulse {
          0%, 100% {
            opacity: 0.95;
            filter: brightness(1);
          }
          50% {
            opacity: 1;
            filter: brightness(1.4);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const colorMap: Record<string, string> = {
    'neon-cyan': '#00ffff',
    'neon-green': '#00ff00',
    'neon-pink': '#ff00ff',
    'neon-purple': '#bf00ff',
    'neon-gold': '#ffd700'
  };
  const themeHex = colorMap[themeColor] || '#ffd700';

  useEffect(() => {
    if (!wheelGroupRef.current || !segments.length) return;
    
    const perfProfile = detectPerformanceProfile();
    const radius = 220;
    const g = d3.select(wheelGroupRef.current);
    g.selectAll("*").remove();

    const pie = d3.pie<any>().value(1).sort(null);
    const arc = d3.arc<any>().innerRadius(45).outerRadius(radius);
    const arcs = g.selectAll("g").data(pie(segments)).enter().append("g");

    // Add glow filter only on high-end devices
    if (!perfProfile.disableFilters) {
      if (!g.select("defs").node()) {
        g.append("defs");
      }
      const defs = g.select("defs");
      const filter = defs.append("filter")
        .attr("id", "glow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      
      filter.append("feGaussianBlur")
        .attr("stdDeviation", "6")
        .attr("result", "coloredBlur");
      
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    }

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d) => {
        const hexColor = COLOR_HEX[d.data.color as keyof typeof COLOR_HEX];
        return hexColor ? hexColor + 'FF' : '#ffffffff'; // Full brightness, no opacity
      })
      .attr("stroke", (d) => {
        // Bright glow for player's color
        if (playerColor && d.data.color === playerColor) {
          const hexColor = COLOR_HEX[d.data.color as keyof typeof COLOR_HEX];
          return hexColor || '#ffffff';
        }
        return themeHex;
      })
      .attr("stroke-width", (d) => {
        // Thicker stroke for player's color
        return playerColor && d.data.color === playerColor ? "8" : "2";
      })
      .attr("stroke-opacity", "1")
      .attr("filter", (d) => {
        // Apply glow to player's segment only on high-end devices
        return (playerColor && d.data.color === playerColor && !perfProfile.disableFilters) ? "url(#glow)" : "none";
      })
      .attr("opacity", (d) => {
        // Make other segments slightly dimmer to make player color stand out
        return playerColor && d.data.color === playerColor ? "1" : "0.9";
      })
      .attr("class", (d) => {
        // Add pulsing animation for player's color - both stroke and fill
        return playerColor && d.data.color === playerColor ? "player-color-pulse player-segment-pulse" : "";
      });

    arcs.append("text")
      .attr("transform", d => {
        const [x, y] = arc.centroid(d);
        const angle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI);
        return `translate(${x * 1.55}, ${y * 1.55}) rotate(${angle - 90})`;
      })
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .attr("font-weight", "900")
      .attr("font-family", "Orbitron")
      .text(d => d.data.label);
  }, [segments, themeHex, playerColor]);

  useEffect(() => {
    // BULLETPROOF: NO DOUBLE SPIN EVER
    // Only reacts to 'spinning' prop changes, ignores all other changes
    
    if (!spinning || spinInProgressRef.current) {
      // Already spinning or not requested to spin
      return;
    }

    // IMMEDIATE LOCK - prevents any re-entry
    spinInProgressRef.current = true;
    
    const targetBaseRotation = -(targetIndex * sliceAngle + (sliceAngle / 2));
    const extraFullSpins = 360 * 10;
    const currentMod = ((currentRotation % 360) + 360) % 360;
    let diff = targetBaseRotation - currentMod;
    if (diff < 0) diff += 360;
    const finalRotation = currentRotation + extraFullSpins + diff;

    const startTime = performance.now();
    // Optimize: Reduce spin duration on low-end devices
    const perfProfile = detectPerformanceProfile();
    const duration = perfProfile.isLowEnd ? 3000 : 8000;
    let lastTickAngle = currentRotation;
    let animationFrameId: number | null = null;
    let hasEnded = false;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      const frameRot = currentRotation + (finalRotation - currentRotation) * easedProgress;
      
      if (Math.abs(frameRot - lastTickAngle) >= sliceAngle) {
        soundManager.play('tick');
        lastTickAngle = frameRot;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else if (!hasEnded) {
        // Animation complete - call onSpinEnd ONCE
        hasEnded = true;
        soundManager.stop('spin');
        spinInProgressRef.current = false; // RESET FOR NEXT SPIN
        setTimeout(() => {
          onSpinEnd();
        }, 500);
      }
    };

    setIsAnimating(true);
    setCurrentRotation(finalRotation);
    soundManager.play('spin');
    animationFrameId = requestAnimationFrame(step);

    // Only cleanup if component unmounts - don't reset lock on re-runs
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [spinning]); // ONLY react to spinning prop changes

  const wheelSize = 'clamp(220px, min(82vw, 58dvh), 520px)';

  return (
    <div
      className="relative flex items-center justify-center select-none overflow-visible"
      style={{ width: wheelSize, height: wheelSize }}
    >
      {/* Outer Glow Ring */}
      <div className="absolute inset-[-10px] rounded-full border-2 transition-all duration-1000 animate-pulse" 
           style={{ borderColor: themeHex, filter: `drop-shadow(0 0 30px ${themeHex}66)` }}></div>
      
      {/* Top Pointer - Positioned in front of wheel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 md:z-40">
        <svg width="50" height="50" viewBox="0 0 50 50">
          <path d="M25 50 L5 5 L45 5 Z" fill={themeHex} filter="drop-shadow(0 0 15px rgba(0,0,0,0.9))" stroke={themeHex} strokeWidth="1.5" />
        </svg>
      </div>
      
      <svg 
        viewBox="-250 -250 500 500" 
        className="w-full h-full overflow-visible z-20 block"
        style={{ width: '100%', height: '100%' }}
      >
        <g 
          ref={wheelGroupRef} 
          style={{ 
            transition: isAnimating ? 'transform 6s cubic-bezier(0.1, 0, 0, 1)' : 'none',
            transform: `rotate(${currentRotation}deg)`,
            transformOrigin: '0px 0px'
          }}
        />
        {/* Core center piece */}
        <circle r="45" fill="#000" stroke={themeHex} strokeWidth="3" />
        <text 
          textAnchor="middle" 
          dy=".35em" 
          fill="white" 
          className="font-arcade text-[10px] tracking-[0.2em] uppercase animate-pulse"
        >
          CORE
        </text>
      </svg>
    </div>
  );
};

export default SpinWheel;
