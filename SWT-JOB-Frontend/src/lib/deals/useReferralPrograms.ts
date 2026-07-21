import { useEffect, useState } from 'react';

import type { ReferralProgram } from '../../data/referralDeals';
import { referralPrograms as staticPrograms } from '../../data/referralDeals';
import { fetchPublicReferralDeals, mergeReferralPrograms } from './referral-deal-api';

export function useReferralPrograms() {
  const [programs, setPrograms] = useState<ReferralProgram[]>(staticPrograms);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPublicReferralDeals()
      .then((records) => {
        if (!active || !records?.length) return;
        setPrograms(mergeReferralPrograms(records));
      })
      .catch(() => {
        // 保持静态数据
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { programs, loading };
}

export function findReferralProgram(programs: ReferralProgram[], id: string) {
  return programs.find((p) => p.id === id);
}
