import { create } from 'zustand';

export type SupportWidgetTab = 'ai' | 'human';

type State = {
  /** 递增以触发 FloatingSupportWidget 打开 */
  openSignal: number;
  tab: SupportWidgetTab;
  humanMessagePrefill: string;
  requestOpen: (tab: SupportWidgetTab, humanMessagePrefill?: string) => void;
};

export const useSupportWidgetStore = create<State>((set) => ({
  openSignal: 0,
  tab: 'human',
  humanMessagePrefill: '',
  requestOpen: (tab, humanMessagePrefill = '') =>
    set((s) => ({
      openSignal: s.openSignal + 1,
      tab,
      humanMessagePrefill,
    })),
}));
