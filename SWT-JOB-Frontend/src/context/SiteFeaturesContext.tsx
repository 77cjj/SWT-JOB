'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  featureKeyForPath,
  fetchPublicSiteFeatures,
  getDefaultSiteFeatures,
  type SiteFeatureKey,
  type SiteFeatureMap,
} from '../lib/site/siteFeaturesApi';

type SiteFeaturesContextValue = {
  features: SiteFeatureMap;
  loading: boolean;
  refresh: () => Promise<void>;
  isFeatureEnabled: (key: SiteFeatureKey) => boolean;
  isPathEnabled: (pathname: string) => boolean;
};

const SiteFeaturesContext = createContext<SiteFeaturesContextValue | null>(null);

export function SiteFeaturesProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<SiteFeatureMap>(getDefaultSiteFeatures);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchPublicSiteFeatures();
      setFeatures(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<SiteFeaturesContextValue>(
    () => ({
      features,
      loading,
      refresh,
      isFeatureEnabled: (key) => features[key] !== false,
      isPathEnabled: (pathname) => {
        const key = featureKeyForPath(pathname);
        if (!key) return true;
        return features[key] !== false;
      },
    }),
    [features, loading, refresh],
  );

  return <SiteFeaturesContext.Provider value={value}>{children}</SiteFeaturesContext.Provider>;
}

export function useSiteFeatures() {
  const ctx = useContext(SiteFeaturesContext);
  if (!ctx) {
    return {
      features: getDefaultSiteFeatures(),
      loading: false,
      refresh: async () => undefined,
      isFeatureEnabled: (key: SiteFeatureKey) => getDefaultSiteFeatures()[key] !== false,
      isPathEnabled: (pathname: string) => {
        const key = featureKeyForPath(pathname);
        if (!key) return true;
        return getDefaultSiteFeatures()[key] !== false;
      },
    } satisfies SiteFeaturesContextValue;
  }
  return ctx;
}
