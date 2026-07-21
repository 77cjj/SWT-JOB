export function isStripePaymentsEnabled(): boolean {
  if (typeof window === 'undefined') {
    return Boolean(
      process.env.STRIPE_SECRET_KEY?.trim() &&
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
    );
  }
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
}

export function getStripePublishableKey(): string | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return key || null;
}
