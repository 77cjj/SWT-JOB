import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** 旧链接兼容：市集已并入薅羊毛子页 */
export default function MarketPage() {
  const router = useRouter();

  useEffect(() => {
    void router.replace('/deals?section=market');
  }, [router]);

  return null;
}
