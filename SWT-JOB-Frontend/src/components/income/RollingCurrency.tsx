'use client';

import { Box } from '@mui/material';

const DIGIT_H = 1.12;

function DigitColumn({ digit }: { digit: number }) {
  const safe = Math.min(9, Math.max(0, digit));
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        height: `${DIGIT_H}em`,
        overflow: 'hidden',
        verticalAlign: 'top',
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          transform: `translateY(-${safe * DIGIT_H}em)`,
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <Box
            component="span"
            key={n}
            sx={{
              height: `${DIGIT_H}em`,
              lineHeight: `${DIGIT_H}em`,
              display: 'block',
              textAlign: 'center',
            }}
          >
            {n}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function RollingCurrency({
  value,
  prefix = '$',
  sx,
}: {
  value: number;
  prefix?: string;
  sx?: object;
}) {
  const rounded = Math.max(0, Math.round(value));
  const formatted = rounded.toLocaleString('en-US');

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'flex-start',
        fontVariantNumeric: 'tabular-nums',
        ...sx,
      }}
    >
      <Box component="span" sx={{ opacity: 0.85, mr: 0.15, alignSelf: 'center' }}>
        {prefix}
      </Box>
      {formatted.split('').map((char, i) =>
        /\d/.test(char) ? (
          <DigitColumn key={`d-${i}`} digit={Number(char)} />
        ) : (
          <Box component="span" key={`s-${i}`} sx={{ alignSelf: 'center', px: 0.05 }}>
            {char}
          </Box>
        ),
      )}
    </Box>
  );
}
