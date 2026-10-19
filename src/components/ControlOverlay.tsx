/**
 * Ergonomic Collapsible HUD Control Dock
 * Supports diverse realistic sounds: crispy crunch, rubber duck quack,
 * puppy bark, car horn beep, water drop, liquid slosh, bubble pop, etc.
 */
import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Camera,
  RotateCcw,
  Hand,
  Smile,
  ChevronDown,
  ChevronUp,
  Layers,
  Palette,
  Heart,
  Flame,
  Music,
} from 'lucide-react';
import { SquishyConfig, ToolMode } from '../three/SquishySimulation';
import { SquishyShape } from '../three/squishyGeometries';
import { TextureType, SoundProfile } from '../audio/asmrAudio';
import { ToppingType } from '../three/ToppingsSystem';

interface ControlOverlayProps {
  config: SquishyConfig;
  activeTool: ToolMode;
  isMuted: boolean;
  asmrBoost: boolean;
  volume: number;
  squishCount: number;
  stressRelief: number;
  onUpdateConfig: (cfg: Partial<SquishyConfig>) => void;
  onSelectTool: (tool: ToolMode) => void;
  onToggleMute: () => void;
  onToggleAsmrBoost: () => void;
  onChangeVolume: (vol: number) => void;
  onResetShape: () => void;
  onResetCamera: () => void;
  onDispenseToppings: () => void;
  onCaptureSnapshot: () => void;
}

type TabType = 'presets' | 'sounds' | 'texture' | 'shape' | 'custom' | 'toppings';

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  config,
  activeTool,
  isMuted,
  asmrBoost,
  volume,
  squishCount,
  stressRelief,
  onUpdateConfig,
  onSelectTool,
  onToggleMute,
  onToggleAsmrBoost,
  onChangeVolume,
  onResetShape,
  onResetCamera,
  onDispenseToppings,
  onCaptureSnapshot,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Sound Profile choices requested by user!
  const soundProfiles: { id: SoundProfile; label: string; icon: string; desc: string }[] = [
    {
      id: 'crispy_crunch',
      label: '바삭바삭 크런치',
      icon: '🥣',
      desc: '감자칩 & 비닐 & 비즈가 바사삭 바스라지는 크런치 사운드',
    },
    {
      id: 'duck_quack',
      label: '꽥꽥 러버덕 삑삑이',
      icon: '🐥',
      desc: '누를 때마다 꽥! 꽤액~ 소리나는 귀여운 오리 삑삑이',
    },
    {
      id: 'puppy_bark',
      label: '멍멍이 강아지 소리',
      icon: '🐶',
      desc: '신나게 멍멍! 왈왈! 짖는 장난감 강아지 소리',
    },
    {
      id: 'car_horn',
      label: '자동차 경적 빵빵',
      icon: '🚗',
      desc: '경쾌한 빵빵! 클랙슨 비프음 사운드',
    },
    {
      id: 'water_drop',
      label: '퐁당퐁당 물소리',
      icon: '💧',
      desc: '맑고 영롱한 물방울 퐁당 & 찰방 사운드',
    },
    {
      id: 'water_slosh',
      label: '찰랑찰랑 꿀렁물소리',
      icon: '🌊',
      desc: '유체가 부드럽게 꿀렁이고 찰랑거리는 물결 사운드',
    },
    {
      id: 'bubble_pop',
      label: '뽁뽁이 버블팝',
      icon: '🫧',
      desc: '에어캡 뽁뽁이를 팡팡 터뜨리는 쾌감 사운드',
    },
    {
      id: 'slime_sticky',
      label: '쫩쫩 촉촉 슬라임',
      icon: '🍓',
      desc: '찰지고 쫀득한 슬라임 반죽 & 기포 팝 사운드',
    },
    {
      id: 'squishy_classic',
      label: '뽀송 메모리폼',
      icon: '🧸',
      desc: '천천히 공기가 차오르는 슬로우라이징 숨소리',
    },
    {
      id: 'auto',
      label: '질감 자동 연동',
      icon: '🪄',
      desc: '현재 선택된 말랑이 질감에 가장 어울리는 사운드 자동 재생',
    },
  ];

  // Preset gallery updated with diverse sounds & shapes!
  const presets = [
    {
      name: '꽥꽥 노랑 러버덕',
      desc: '눌렀다 떼면 꽥꽥 우는 오리 삑삑이',
      color: '#ffd000',
      texture: 'water_ball' as TextureType,
      shape: 'duck' as SquishyShape,
      soundProfile: 'duck_quack' as SoundProfile,
      topping: 'foam_beads' as ToppingType,
      toppingCount: 0,
      translucency: 0.1,
      roughness: 0.4,
      slowRise: 0.3,
      glitter: false,
    },
    {
      name: '바둑이 멍멍이 스퀴시',
      desc: '누를 때마다 멍멍! 짖는 아기 강아지',
      color: '#fff3b0',
      texture: 'taba' as TextureType,
      shape: 'puppy' as SquishyShape,
      soundProfile: 'puppy_bark' as SoundProfile,
      topping: 'star_glitter' as ToppingType,
      toppingCount: 15,
      translucency: 0.05,
      roughness: 0.85,
      slowRise: 0.65,
      glitter: false,
    },
    {
      name: '바사삭 감자칩 크런치',
      desc: '바삭바삭! 소리 극대화 크런치 볼',
      color: '#ffb703',
      texture: 'crunch_mallangi' as TextureType,
      shape: 'stress_ball' as SquishyShape,
      soundProfile: 'crispy_crunch' as SoundProfile,
      topping: 'bingsu_flakes' as ToppingType,
      toppingCount: 130,
      translucency: 0.25,
      roughness: 0.3,
      slowRise: 0.2,
      glitter: false,
    },
    {
      name: '찰랑찰랑 청량 워터볼',
      desc: '꿀렁꿀렁 찰랑거리는 에메랄드 물소리',
      color: '#00f5d4',
      texture: 'water_ball' as TextureType,
      shape: 'stress_ball' as SquishyShape,
      soundProfile: 'water_slosh' as SoundProfile,
      topping: 'pearls' as ToppingType,
      toppingCount: 40,
      translucency: 0.85,
      roughness: 0.08,
      slowRise: 0.15,
      glitter: true,
    },
    {
      name: '퐁당퐁당 이슬 복숭아',
      desc: '맑은 물방울이 퐁당 떨어지는 피치',
      color: '#ff758f',
      texture: 'glossy_slime' as TextureType,
      shape: 'peach' as SquishyShape,
      soundProfile: 'water_drop' as SoundProfile,
      topping: 'fruit_slices' as ToppingType,
      toppingCount: 25,
      translucency: 0.6,
      roughness: 0.1,
      slowRise: 0.4,
      glitter: false,
    },
    {
      name: '빵빵이 자동차 스퀴시',
      desc: '꽉 쥐면 빵빵! 시원한 경적 클랙슨',
      color: '#e63946',
      texture: 'squishy' as TextureType,
      shape: 'stress_ball' as SquishyShape,
      soundProfile: 'car_horn' as SoundProfile,
      topping: 'foam_beads' as ToppingType,
      toppingCount: 0,
      translucency: 0.0,
      roughness: 0.5,
      slowRise: 0.4,
      glitter: false,
    },
    {
      name: '딸기 빙수 크런치 슬라임',
      desc: '바삭한 크리스탈 비즈 & 투명 슬라임',
      color: '#ff4d6d',
      texture: 'crunch_slime' as TextureType,
      shape: 'slime_pool' as SquishyShape,
      soundProfile: 'crispy_crunch' as SoundProfile,
      topping: 'bingsu_flakes' as ToppingType,
      toppingCount: 120,
      translucency: 0.85,
      roughness: 0.05,
      slowRise: 0.2,
      glitter: true,
    },
    {
      name: '냥이 젤리 발바닥 타바',
      desc: '말랑탱탱 뽀송 고양이 젤리',
      color: '#ffffff',
      texture: 'squishy' as TextureType,
      shape: 'cat_paw' as SquishyShape,
      soundProfile: 'squishy_classic' as SoundProfile,
      topping: 'foam_beads' as ToppingType,
      toppingCount: 0,
      translucency: 0.08,
      roughness: 0.75,
      slowRise: 0.8,
      glitter: false,
    },
  ];

  const colorSwatches = [
    '#ffd000', '#ffb703', '#fb8500', '#e63946',
    '#ff4d6d', '#ff758f', '#ffb3c1', '#f72585',
    '#00f5d4', '#06d6a0', '#70e000', '#52b788',
    '#48cae4', '#118ab2', '#0077b6',
    '#9b5de5', '#7209b7', '#b5179e',
    '#ffffff', '#fff1e6', '#2b2d42',
  ];

  const tools: { id: ToolMode; label: string; icon: string }[] = [
    { id: 'poke', label: '콕 찌르기 (Poke)', icon: '👇' },
    { id: 'squeeze', label: '꽉 쥐기 (Squeeze)', icon: '✊' },
    { id: 'stretch', label: '쫀득 늘리기 (Stretch)', icon: '↔️' },
    { id: 'slap', label: '찰싹 때리기 (Slap)', icon: '👋' },
    { id: 'roll', label: '반죽 굴리기 (Roll)', icon: '🌀' },
  ];

  const textures: { id: TextureType; label: string; desc: string; tag: string }[] = [
    { id: 'squishy', label: '말랑이 / 스퀴시', desc: '부드러운 메모리폼, 천천히 부풀어 오르는 슬로우라이징', tag: '기본' },
    { id: 'taba', label: '타바 말랑이 (Taba)', desc: '뽀송뽀송 벨벳 파우더 마감, 극세사 모찌 촉감', tag: '대세' },
    { id: 'glossy_slime', label: '클리어 글레이즈 슬라임', desc: '투명하고 촉촉한 찰랑 슬라임, 쫩쫩 기포 팝 사운드', tag: '리얼' },
    { id: 'crunch_mallangi', label: '크런치 말랑이 (폼볼)', desc: '스티로폼 알갱이가 꽉 찬 바스락 ASMR 말랑이', tag: '인기' },
    { id: 'crunch_slime', label: '크런치 슬라임 (빙수 비즈)', desc: '영롱한 크리스탈 비즈가 터지는 바삭 사운드', tag: 'ASMR' },
    { id: 'water_ball', label: '워터볼 / 그물망 스퀴시', desc: '탄력 고무 속 액체가 꿀렁이는 말랑 볼', tag: '탱탱' },
  ];

  const shapes: { id: SquishyShape; label: string; icon: string }[] = [
    { id: 'duck', label: '러버덕 오리', icon: '🐥' },
    { id: 'puppy', label: '멍멍이 강아지', icon: '🐶' },
    { id: 'bear', label: '곰돌이 말랑이', icon: '🧸' },
    { id: 'cat_paw', label: '냥발바닥 타바', icon: '🐾' },
    { id: 'peach', label: '복숭아 하트', icon: '🍑' },
    { id: 'dumpling', label: '촉촉 만두 스퀴시', icon: '🥟' },
    { id: 'slime_pool', label: '슬라임 웅덩이', icon: '💧' },
    { id: 'stress_ball', label: '라운드 스트레스볼', icon: '⚪' },
  ];

  const toppings: { id: ToppingType; label: string; desc: string }[] = [
    { id: 'foam_beads', label: '파스텔 폼볼 (Styrofoam Beads)', desc: '가볍고 사각거리는 마카롱 컬러 스티로폼 알갱이' },
    { id: 'bingsu_flakes', label: '바삭 빙수 비즈 (Bingsu Flakes)', desc: 'ASMR 최고 인기! 바사삭 크리스탈 각설탕 질감' },
    { id: 'pearls', label: '영롱 진주 구슬 (Pearls)', desc: '매끈하고 단단하게 부딪히는 진주 비즈' },
    { id: 'star_glitter', label: '스파클링 별 글리터 (Stars)', desc: '빛에 반짝이는 쁘띠 별 조각' },
    { id: 'fruit_slices', label: '과일 슬라이스 토핑 (Fruits)', desc: '딸기, 레몬 등 알록달록 미니어처 과일 토핑' },
  ];

  const currentSound = soundProfiles.find((s) => s.id === config.soundProfile) || soundProfiles[0];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-5 select-none overflow-hidden">
      {/* 1. Top HUD Bar */}
      <header className="flex items-center justify-between gap-3 pointer-events-auto">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 bg-white/95 border border-stone-200 shadow-sm rounded-2xl px-4 py-2">
          <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg shadow-inner">
            ✨
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold text-stone-800 tracking-tight leading-none flex items-center gap-1.5">
              말랑이 & 슬라임 3D ASMR
              <span className="text-[10px] font-semibold bg-pink-50 text-pink-600 border border-pink-200 px-1.5 py-0.5 rounded-md">
                사운드 스튜디오
              </span>
            </h1>
            <p className="text-[11px] text-stone-500 font-medium mt-0.5">
              현재 소리: <strong className="text-pink-600">{currentSound.icon} {currentSound.label}</strong>
            </p>
          </div>
        </div>

        {/* Center Live Squish & ASMR Combo Stats */}
        <div className="hidden sm:flex items-center gap-3 bg-white/95 border border-stone-200 shadow-sm rounded-2xl px-4 py-2">
          <div className="flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-pink-500" />
            <div className="text-xs">
              <span className="text-stone-500">말랑 터치: </span>
              <span className="font-extrabold text-pink-600">{squishCount}회</span>
            </div>
          </div>
          <div className="w-[1px] h-4 bg-stone-200" />
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <div className="text-xs">
              <span className="text-stone-500">스트레스 해소: </span>
              <span className="font-extrabold text-amber-600">{Math.min(100, stressRelief)}%</span>
            </div>
          </div>
        </div>

        {/* Right Top Quick Utilities */}
        <div className="flex items-center gap-1.5 bg-white/95 border border-stone-200 shadow-sm rounded-2xl p-1.5">
          {/* Quick Sound Switch Button */}
          <button
            onClick={() => {
              setActiveTab('sounds');
              setIsCollapsed(false);
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-all flex items-center gap-1.5"
            title="소리 변경하기"
          >
            <span>{currentSound.icon}</span>
            <span className="hidden lg:inline">{currentSound.label.split(' ')[0]}</span>
          </button>

          {/* ASMR Boost Toggle */}
          <button
            onClick={onToggleAsmrBoost}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              asmrBoost
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            title="ASMR 크런치 사운드 증폭 (이어폰 추천)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ASMR 부스트</span>
          </button>

          {/* Sound Mute */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl transition-all ${
              isMuted
                ? 'bg-red-50 text-red-500'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Reset Camera */}
          <button
            onClick={onResetCamera}
            className="p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-all"
            title="카메라 각도 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Snapshot Photo */}
          <button
            onClick={onCaptureSnapshot}
            className="p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-all"
            title="내 말랑이 사진 찍기 (캡처)"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Interactive Tool Switcher (Center-Right Floating Dock) */}
      <div className="absolute right-3 top-24 md:right-5 flex flex-col gap-1.5 pointer-events-auto bg-white/95 border border-stone-200 shadow-md rounded-2xl p-1.5 max-w-[130px] z-10">
        <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider text-center border-b border-stone-100">
          터치 도구
        </div>
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTool === t.id
                ? 'bg-pink-500 text-white shadow-sm'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="text-sm">{t.icon}</span>
            <span className="truncate">{t.label.split(' ')[0]}</span>
          </button>
        ))}

        <div className="pt-1 border-t border-stone-100 flex flex-col gap-1">
          <button
            onClick={onResetShape}
            className="px-2 py-1.5 rounded-xl text-[11px] font-semibold text-stone-600 hover:bg-pink-50 hover:text-pink-600 transition-all text-center flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            말랑 원형복원
          </button>
          <button
            onClick={onDispenseToppings}
            className="px-2 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all text-center"
          >
            + 토핑 붓기
          </button>
        </div>
      </div>

      {/* 2. Sleek Ergonomic Collapsible Bottom Control Dock */}
      <footer className="w-full flex justify-center pointer-events-auto mb-1">
        <div className="w-full max-w-[900px] bg-white border border-stone-200 shadow-xl rounded-3xl overflow-hidden transition-all duration-300">
          {/* Header Bar with Tab Switches & Collapse Drawer Button */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100 bg-stone-50/70">
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  setActiveTab('presets');
                  if (isCollapsed) setIsCollapsed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'presets' && !isCollapsed
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                인기 프리셋
              </button>

              <button
                onClick={() => {
                  setActiveTab('sounds');
                  if (isCollapsed) setIsCollapsed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'sounds' && !isCollapsed
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                사운드 팩
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('shape');
                  if (isCollapsed) setIsCollapsed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'shape' && !isCollapsed
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                모양 선택
              </button>

              <button
                onClick={() => {
                  setActiveTab('texture');
                  if (isCollapsed) setIsCollapsed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'texture' && !isCollapsed
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                질감 & 타입
              </button>

              <button
                onClick={() => {
                  setActiveTab('custom');
                  if (isCollapsed) setIsCollapsed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'custom' && !isCollapsed
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                색상 & 물성
              </button>

              <button
                onClick={() => {
                  setActiveTab('toppings');
                  if (isCollapsed) setIsCollapsed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'toppings' && !isCollapsed
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                크런치 토핑
              </button>
            </div>

            {/* Collapse / Expand Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-xl text-stone-500 hover:bg-stone-200 transition-all flex items-center gap-1 text-xs font-medium ml-2 shrink-0"
              title={isCollapsed ? '컨트롤 열기' : '뷰포트 전체보기 (컨트롤 접기)'}
            >
              {isCollapsed ? (
                <>
                  <span className="hidden sm:inline">열기</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">접기</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Drawer Body (Collapsible) */}
          {!isCollapsed && (
            <div className="p-3.5 max-h-[230px] overflow-y-auto">
              {/* TAB 1: PRESETS */}
              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onUpdateConfig({
                          baseColor: p.color,
                          texture: p.texture,
                          shape: p.shape,
                          soundProfile: p.soundProfile,
                          toppingType: p.topping,
                          toppingCount: p.toppingCount,
                          translucency: p.translucency,
                          roughness: p.roughness,
                          slowRise: p.slowRise,
                          glitter: p.glitter,
                        });
                      }}
                      className="flex flex-col text-left p-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-pink-50 hover:border-pink-300 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-[10px] font-semibold text-pink-600 bg-pink-100/60 px-1.5 py-0.5 rounded-md">
                          {p.soundProfile === 'duck_quack'
                            ? '꽥꽥'
                            : p.soundProfile === 'puppy_bark'
                            ? '멍멍'
                            : p.soundProfile === 'car_horn'
                            ? '빵빵'
                            : p.soundProfile === 'crispy_crunch'
                            ? '바삭'
                            : p.soundProfile.includes('water')
                            ? '물소리'
                            : '슬라임'}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-stone-800 group-hover:text-pink-600">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                        {p.desc}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* TAB 2: SOUND PACKS (Requested by user: crispy crunch, duck, puppy, car horn, water, etc.) */}
              {activeTab === 'sounds' && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-stone-500 px-0.5 flex items-center justify-between">
                    <span>터치할 때 울려 퍼지는 ASMR 사운드를 선택하세요:</span>
                    <span className="text-pink-600 font-bold">10가지 리얼 사운드 내장</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {soundProfiles.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onUpdateConfig({ soundProfile: s.id })}
                        className={`flex items-start gap-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                          config.soundProfile === s.id
                            ? 'border-pink-500 bg-pink-50/80 shadow-xs ring-1 ring-pink-400'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-xl shrink-0 p-1 rounded-xl bg-stone-100">{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-stone-800 truncate">{s.label}</span>
                            {config.soundProfile === s.id && (
                              <span className="text-[9px] font-extrabold text-pink-600 bg-pink-100 px-1 py-0.2 rounded">
                                사용중
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1 leading-snug">
                            {s.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: SHAPES */}
              {activeTab === 'shape' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-2">
                  {shapes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onUpdateConfig({ shape: s.id })}
                      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                        config.shape === s.id
                          ? 'border-pink-500 bg-pink-50/80 shadow-xs ring-1 ring-pink-400'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <span className="font-bold text-xs text-stone-800 block">{s.label}</span>
                        <span className="text-[10px] text-stone-400">3D 소프트바디</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* TAB 4: TEXTURES */}
              {activeTab === 'texture' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {textures.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateConfig({ texture: t.id })}
                      className={`flex flex-col text-left p-2.5 rounded-2xl border transition-all ${
                        config.texture === t.id
                          ? 'border-pink-500 bg-pink-50/70 shadow-xs ring-1 ring-pink-400'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-800">{t.label}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                          {t.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                        {t.desc}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* TAB 5: CUSTOM (Color & Physical Material) */}
              {activeTab === 'custom' && (
                <div className="space-y-3">
                  {/* Colors */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 mb-1.5 flex items-center justify-between">
                      <span>말랑이 기본 색상 (Base Color)</span>
                      <span className="text-stone-400 font-mono text-[10px]">{config.baseColor}</span>
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {colorSwatches.map((c) => (
                        <button
                          key={c}
                          onClick={() => onUpdateConfig({ baseColor: c })}
                          className={`w-6 h-6 rounded-full border transition-all ${
                            config.baseColor.toLowerCase() === c.toLowerCase()
                              ? 'scale-125 border-stone-800 shadow-sm ring-2 ring-pink-300'
                              : 'border-stone-300 hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      {/* Custom color input */}
                      <input
                        type="color"
                        value={config.baseColor}
                        onChange={(e) => onUpdateConfig({ baseColor: e.target.value })}
                        className="w-7 h-7 p-0 rounded-full border border-stone-300 cursor-pointer overflow-hidden"
                        title="직접 색상 지정"
                      />
                    </div>
                  </div>

                  {/* Sliders: Translucency, SlowRise, Roughness */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-stone-600 mb-1">
                        <span>투명도 (Translucency)</span>
                        <span>{Math.round(config.translucency * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.9"
                        step="0.05"
                        value={config.translucency}
                        onChange={(e) => onUpdateConfig({ translucency: parseFloat(e.target.value) })}
                        className="w-full accent-pink-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-stone-600 mb-1">
                        <span>슬로우라이징 (복원 속도)</span>
                        <span>{config.slowRise > 0.6 ? '느리게 차오름' : '탱탱한 탄력'}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.95"
                        step="0.05"
                        value={config.slowRise}
                        onChange={(e) => onUpdateConfig({ slowRise: parseFloat(e.target.value) })}
                        className="w-full accent-pink-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-stone-600 mb-1">
                        <span>표면 광택 (매트 vs 촉촉)</span>
                        <span>{config.roughness > 0.5 ? '뽀송 벨벳' : '유리알 광택'}</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.9"
                        step="0.05"
                        value={config.roughness}
                        onChange={(e) => onUpdateConfig({ roughness: parseFloat(e.target.value) })}
                        className="w-full accent-pink-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: TOPPINGS */}
              {activeTab === 'toppings' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {toppings.map((tp) => (
                      <button
                        key={tp.id}
                        onClick={() => onUpdateConfig({ toppingType: tp.id })}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          config.toppingType === tp.id
                            ? 'border-pink-500 bg-pink-50/70 shadow-xs ring-1 ring-pink-400'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="font-bold text-xs text-stone-800">{tp.label}</div>
                        <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">{tp.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1 bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                        <span>크런치 토핑 수량</span>
                        <span className="font-bold text-pink-600">{config.toppingCount}개</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="160"
                        step="10"
                        value={config.toppingCount}
                        onChange={(e) => onUpdateConfig({ toppingCount: parseInt(e.target.value) })}
                        className="w-full accent-pink-500 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={onDispenseToppings}
                      className="px-3.5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-sm transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      토핑 와르르 붓기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
