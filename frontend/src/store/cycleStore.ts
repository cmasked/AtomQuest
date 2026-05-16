import { create } from 'zustand';

interface Cycle {
  id: string;
  name: string;
  phase: 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4';
  opensAt: string;
  closesAt: string;
}

interface CycleState {
  activeCycle: Cycle | null;
  setActiveCycle: (cycle: Cycle) => void;
}

export const useCycleStore = create<CycleState>((set) => ({
  activeCycle: null,
  setActiveCycle: (cycle) => set({ activeCycle: cycle }),
}));
