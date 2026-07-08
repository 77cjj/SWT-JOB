'use client';

import { useMemo } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import type { JobRecord } from '../../types/job';
import { STATE_CENTROIDS, US_OUTLINE_PATH } from '../../lib/jobs/stateCentroids';

type Props = {
  jobs: JobRecord[];
  selectedState: string;
  onStateSelect: (state: string) => void;
};

export function UsJobsMap({ jobs, selectedState, onStateSelect }: Props) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const job of jobs) {
      map.set(job.state, (map.get(job.state) ?? 0) + 1);
    }
    return map;
  }, [jobs]);

  const statesWithJobs = useMemo(() => Array.from(counts.keys()), [counts]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        bgcolor: (theme) =>
          theme.palette.mode === 'light' ? 'grey.50' : 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          地图选州
        </Typography>
        {selectedState !== 'all' ? (
          <Button size="small" onClick={() => onStateSelect('all')}>
            清除筛选
          </Button>
        ) : null}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        点击有岗位标记的州快速筛选。地图为示意，无外部地图 API。
      </Typography>
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <svg
          viewBox="0 0 1000 600"
          role="img"
          aria-label="美国岗位分布示意地图"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <path
            d={US_OUTLINE_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            opacity={0.25}
          />
          {statesWithJobs.map((state) => {
            const centroid = STATE_CENTROIDS[state];
            if (!centroid) return null;
            const count = counts.get(state) ?? 0;
            const active = selectedState === state;
            const r = 12 + Math.min(count, 4) * 3;
            return (
              <g
                key={state}
                style={{ cursor: 'pointer' }}
                onClick={() => onStateSelect(active ? 'all' : state)}
              >
                <circle
                  cx={centroid.x}
                  cy={centroid.y}
                  r={r + 4}
                  fill="rgba(99,102,241,0.15)"
                  opacity={active ? 1 : 0.6}
                />
                <circle
                  cx={centroid.x}
                  cy={centroid.y}
                  r={r}
                  fill={active ? '#6366f1' : '#94a3b8'}
                  stroke={active ? '#4338ca' : '#64748b'}
                  strokeWidth={active ? 2.5 : 1}
                />
                <text
                  x={centroid.x}
                  y={centroid.y + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="#fff"
                >
                  {state}
                </text>
                <title>{`${state}: ${count} 条岗位`}</title>
              </g>
            );
          })}
        </svg>
      </Box>
    </Paper>
  );
}
