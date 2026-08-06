import { useCallback, useEffect, useState } from 'react';

import type { ReferralProgram } from '../../data/referralDeals';
import { referralPrograms as staticPrograms } from '../../data/referralDeals';
import {
  fetchExcludedDealIds,
  fetchPublicReferralDeals,
  mergeReferralPrograms,
} from './referral-deal-api';

export function useReferralPrograms() {
  const [programs, setPrograms] = useState<ReferralProgram[]>(staticPrograms);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [records, excludedIds] = await Promise.all([
        fetchPublicReferralDeals(),
        fetchExcludedDealIds(),
      ]);
      setPrograms(mergeReferralPrograms(records, excludedIds));
    } catch {
      // 保持现有数据
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      await refresh();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  return { programs, loading, refresh, setPrograms };
}

export function findReferralProgram(programs: ReferralProgram[], id: string) {
  return programs.find((p) => p.id === id);
}
