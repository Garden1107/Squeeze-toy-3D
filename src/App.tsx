/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SquishySimulation, SquishyConfig, ToolMode } from './three/SquishySimulation';
import { ControlOverlay } from './components/ControlOverlay';
import { asmrEngine } from './audio/asmrAudio';
import { Download, X, Sparkles, Check } from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<SquishySimulation | null>(null);

  // Squishy Configuration State
  const [config, setConfig] = useState<SquishyConfig>({
    shape: 'duck',
    texture: 'taba',
    soundProfile: 'duck_quack',
    baseColor: '#ffd000',
    subColor: '#ff758f',
    roughness: 0.5,
    translucency: 0.05,
    slowRise: 0.5,
    toppingType: 'star_glitter',
    toppingCount: 20,
    glitter: false,
  });

  const [activeTool, setActiveTool] = useState<ToolMode>('poke');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [asmrBoost, setAsmrBoost] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.85);

  // Playfulness & ASMR Counters
  const [squishCount, setSquishCount] = useState<number>(0);
  const [stressRelief, setStressRelief] = useState<number>(0);

  // Snapshot modal
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // Initialize Three.js simulation once
  useEffect(() => {
    if (!mountRef.current) return;

    const sim = new SquishySimulation(mountRef.current, config);
    simRef.current = sim;

    sim.onSquishEvent = (eventType) => {
      setSquishCount((prev) => prev + 1);
      setStressRelief((prev) => Math.min(100, prev + 2));
    };

    // Auto fade guide tooltip after 6 seconds
    const timer = setTimeout(() => {
      setShowGuide(false);
    }, 6000);

    return () => {
      clearTimeout(timer);
      sim.dispose();
      simRef.current = null;
    };
  }, []);

  // Update simulation when config changes
  const handleUpdateConfig = useCallback((newConfig: Partial<SquishyConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...newConfig };
      if (simRef.current) {
        simRef.current.updateConfig(newConfig);
      }
      return merged;
    });
  }, []);

  const handleSelectTool = useCallback((tool: ToolMode) => {
    setActiveTool(tool);
    if (simRef.current) {
      simRef.current.setToolMode(tool);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    asmrEngine.setMuted(next);
  }, [isMuted]);

  const handleToggleAsmrBoost = useCallback(() => {
    const next = !asmrBoost;
    setAsmrBoost(next);
    asmrEngine.setAsmrBoost(next);
  }, [asmrBoost]);

  const handleChangeVolume = useCallback((val: number) => {
    setVolume(val);
    asmrEngine.setVolume(val);
  }, []);

  const handleResetShape = useCallback(() => {
    if (simRef.current) {
      simRef.current.resetShape();
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    if (simRef.current) {
      simRef.current.resetCamera();
    }
  }, []);

  const handleDispenseToppings = useCallback(() => {
    if (simRef.current) {
      simRef.current.dispenseToppings();
      setConfig((prev) => ({
        ...prev,
        toppingCount: Math.min(prev.toppingCount + 30, 180),
      }));
    }
  }, []);

  const handleCaptureSnapshot = useCallback(() => {
    if (simRef.current) {
      const url = simRef.current.captureSnapshot();
      setSnapshotUrl(url);
    }
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#f7f3ef] select-none">
      {/* 1. Dedicated Three.js WebGL Mount Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 2. Interactive HUD Overlay */}
      <ControlOverlay
        config={config}
        activeTool={activeTool}
        isMuted={isMuted}
        asmrBoost={asmrBoost}
        volume={volume}
        squishCount={squishCount}
        stressRelief={stressRelief}
        onUpdateConfig={handleUpdateConfig}
        onSelectTool={handleSelectTool}
        onToggleMute={handleToggleMute}
        onToggleAsmrBoost={handleToggleAsmrBoost}
        onChangeVolume={handleChangeVolume}
        onResetShape={handleResetShape}
        onResetCamera={handleResetCamera}
        onDispenseToppings={handleDispenseToppings}
        onCaptureSnapshot={handleCaptureSnapshot}
      />

      {/* 3. Subtle Onboarding Guide Toast */}
      {showGuide && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/95 text-stone-700 border border-stone-200 shadow-lg px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs pointer-events-auto transition-opacity duration-300">
          <span className="text-xl">🐥</span>
          <div>
            <div className="font-bold text-stone-900">말랑이 터치 & 사운드 팁</div>
            <div className="text-stone-500 text-[11px]">
              마우스 왼쪽 클릭으로 찌르고 쥐어보세요! 하단의 <strong>[사운드 팩]</strong>에서 바삭바삭, 오리, 멍멍이, 경적, 물소리 등으로 자유롭게 바꿀 수 있습니다.
            </div>
          </div>
          <button
            onClick={() => setShowGuide(false)}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Snapshot Modal */}
      {snapshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <h3 className="font-bold text-stone-800 text-sm">내 커스텀 말랑이 스냅샷</h3>
              </div>
              <button
                onClick={() => setSnapshotUrl(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 mb-4 shadow-inner">
              <img src={snapshotUrl} alt="Squishy Snapshot" className="w-full h-auto object-contain" />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSnapshotUrl(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-all"
              >
                닫기
              </button>
              <a
                href={snapshotUrl}
                download="my-custom-mallangi.png"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-500 hover:bg-pink-600 text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                이미지 저장하기
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
