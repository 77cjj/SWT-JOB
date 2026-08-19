'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSiteFeatures } from '../../context/SiteFeaturesContext';
import { featureKeyForPath, firstEnabledHref } from '../../lib/site/siteFeaturesApi';

/**
 * 功能关闭时：不渲染蒙版，直接跳到仍开放的模块。
 */
export function FeatureMaintenanceGate() {
  const router = useRouter();
  const { features, loading } = useSiteFeatures();
  const pathname = router.pathname || '';

  useEffect(() => {
    if (loading) return;
    if (pathname.startsWith('/admin') || pathname.startsWith('/studio')) return;
    const key = featureKeyForPath(pathname);
    if (!key) return;
    if (features[key] !== false) return;
    const next = firstEnabledHref(features);
    if (next !== pathname) {
      void router.replace(next);
    }
  }, [features, loading, pathname, router]);

  return null;
}
