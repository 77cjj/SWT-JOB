'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'next/link';
import { useReferralPrograms } from '../../lib/deals/useReferralPrograms';
import { useI18n } from '../../context/I18nContext';
import { pickBilingual } from '../../i18n/bilingual';
import type { Language } from '../../i18n/types';

export type DealListStatus = 'wishlist' | 'doing' | 'done';

export type DealListItem = {
  id: string;
  dealId: string;
  note: string;
  status: DealListStatus;
};

/** 兼容旧看板 localStorage 结构 */
type LegacyBoardState = Partial<Record<DealListStatus, Array<{ id: string; dealId: string; note: string }>>>;

const STATUS_META: { id: DealListStatus; zh: string; en: string; tone: string }[] = [
  { id: 'wishlist', zh: '想薅', en: 'Wishlist', tone: 'rgba(14,116,144,0.12)' },
  { id: 'doing', zh: '进行中', en: 'In progress', tone: 'rgba(180,83,9,0.12)' },
  { id: 'done', zh: '已完成', en: 'Done', tone: 'rgba(15,23,42,0.08)' },
];

function storageKey(userId: string) {
  return `swt-deal-board:${userId}`;
}

function loadItems(userId: string): DealListItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LegacyBoardState | DealListItem[];
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => x && x.dealId && x.status);
    }
    const next: DealListItem[] = [];
    for (const status of STATUS_META.map((s) => s.id)) {
      const col = parsed[status];
      if (!Array.isArray(col)) continue;
      for (const item of col) {
        if (!item?.dealId) continue;
        next.push({
          id: item.id || `db_${Math.random().toString(36).slice(2, 9)}`,
          dealId: item.dealId,
          note: item.note || '',
          status,
        });
      }
    }
    return next;
  } catch {
    return [];
  }
}

function saveItems(userId: string, items: DealListItem[]) {
  try {
    // 同时写扁平列表 + 旧看板结构，避免其他入口读旧格式时丢数据
    const board: LegacyBoardState = { wishlist: [], doing: [], done: [] };
    for (const item of items) {
      const bucket = board[item.status] || (board[item.status] = []);
      bucket.push({ id: item.id, dealId: item.dealId, note: item.note });
    }
    window.localStorage.setItem(storageKey(userId), JSON.stringify(board));
  } catch {
    // ignore
  }
}

function newItemId() {
  return `db_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

type ProfileDealListProps = {
  userId: string;
  language: Language;
  editable: boolean;
};

export default function ProfileDealList({ userId, language, editable }: ProfileDealListProps) {
  const { t } = useI18n();
  const { programs } = useReferralPrograms();
  const [items, setItems] = useState<DealListItem[]>([]);
  const [pickDealId, setPickDealId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DealListStatus>('all');

  useEffect(() => {
    setItems(loadItems(userId));
  }, [userId]);

  const titleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of programs) {
      map.set(p.id, pickBilingual(p.brandName, language));
    }
    return map;
  }, [programs, language]);

  const persist = (next: DealListItem[]) => {
    setItems(next);
    saveItems(userId, next);
  };

  const addItem = () => {
    if (!pickDealId) return;
    if (items.some((x) => x.dealId === pickDealId && x.status !== 'done')) {
      return;
    }
    persist([
      { id: newItemId(), dealId: pickDealId, note: '', status: 'wishlist' },
      ...items,
    ]);
    setPickDealId('');
  };

  const visible = statusFilter === 'all' ? items : items.filter((x) => x.status === statusFilter);

  const label = (status: DealListStatus) => {
    const meta = STATUS_META.find((s) => s.id === status)!;
    return language === 'zh' ? meta.zh : meta.en;
  };

  return (
    <Box component="section" sx={{ mt: { xs: 1, md: 2 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'flex-end' }}
        justifyContent="space-between"
        gap={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography
            component="h2"
            sx={{
              fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
              fontWeight: 700,
              fontSize: { xs: '1.35rem', md: '1.55rem' },
              letterSpacing: '-0.02em',
              color: '#0f172a',
            }}
          >
            {language === 'zh' ? '我的薅羊毛' : 'My deals'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(15,23,42,0.55)', mt: 0.35, maxWidth: 520 }}>
            {language === 'zh'
              ? '用列表跟踪想薅 / 进行中 / 已完成，点进去看攻略。'
              : 'Track wishlist, in-progress, and done deals in one list.'}
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/deals"
          size="small"
          endIcon={<OpenInNewIcon fontSize="small" />}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' }, color: '#0e7490' }}
        >
          {t('nav.deals')}
        </Button>
      </Stack>

      {editable ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ sm: 'center' }}
          sx={{ mb: 2 }}
        >
          <TextField
            select
            size="small"
            label={language === 'zh' ? '添加项目' : 'Add a deal'}
            value={pickDealId}
            onChange={(e) => setPickDealId(e.target.value)}
            sx={{ minWidth: 200, flex: 1 }}
          >
            {programs.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {pickBilingual(p.brandName, language)}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addItem}
            disabled={!pickDealId}
            sx={{ bgcolor: '#0e7490', '&:hover': { bgcolor: '#0f766e' }, flexShrink: 0 }}
          >
            {language === 'zh' ? '加入列表' : 'Add'}
          </Button>
        </Stack>
      ) : null}

      <Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: 'wrap' }} useFlexGap>
        {([{ id: 'all' as const, zh: '全部', en: 'All' }, ...STATUS_META]).map((s) => {
          const active = statusFilter === s.id;
          return (
            <Button
              key={s.id}
              size="small"
              variant={active ? 'contained' : 'text'}
              onClick={() => setStatusFilter(s.id)}
              sx={{
                borderRadius: 999,
                px: 1.5,
                minWidth: 0,
                bgcolor: active ? '#0f172a' : 'transparent',
                color: active ? '#fff' : 'rgba(15,23,42,0.65)',
                '&:hover': { bgcolor: active ? '#0f172a' : 'rgba(15,23,42,0.06)' },
              }}
            >
              {language === 'zh' ? s.zh : s.en}
              {s.id !== 'all' ? (
                <Box component="span" sx={{ ml: 0.5, opacity: 0.7 }}>
                  {items.filter((x) => x.status === s.id).length}
                </Box>
              ) : null}
            </Button>
          );
        })}
      </Stack>

      <Box
        sx={{
          borderTop: '1px solid rgba(15,23,42,0.1)',
        }}
      >
        {visible.length === 0 ? (
          <Typography variant="body2" sx={{ py: 3, color: 'rgba(15,23,42,0.45)' }}>
            {language === 'zh' ? '列表还是空的——去薅羊毛页挑几个感兴趣的。' : 'Empty list — pick deals from the catalog.'}
          </Typography>
        ) : (
          visible.map((item, index) => {
            const meta = STATUS_META.find((s) => s.id === item.status)!;
            return (
              <Box
                key={item.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
                  gap: { xs: 1, md: 2 },
                  alignItems: 'center',
                  py: 1.75,
                  borderBottom: '1px solid rgba(15,23,42,0.08)',
                  animation: 'profileRowIn .35s ease both',
                  animationDelay: `${Math.min(index, 8) * 0.04}s`,
                  '@keyframes profileRowIn': {
                    from: { opacity: 0, transform: 'translateY(6px)' },
                    to: { opacity: 1, transform: 'none' },
                  },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" useFlexGap>
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: '#0f172a',
                      }}
                    >
                      {titleById.get(item.dealId) || item.dealId}
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        px: 1,
                        py: 0.15,
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        bgcolor: meta.tone,
                        color: '#0f172a',
                      }}
                    >
                      {label(item.status)}
                    </Box>
                  </Stack>
                  {editable ? (
                    <TextField
                      size="small"
                      placeholder={language === 'zh' ? '备注（可选）' : 'Note (optional)'}
                      value={item.note}
                      onChange={(e) =>
                        persist(
                          items.map((x) => (x.id === item.id ? { ...x, note: e.target.value } : x)),
                        )
                      }
                      fullWidth
                      variant="standard"
                      sx={{ mt: 0.5, maxWidth: 420 }}
                    />
                  ) : item.note ? (
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(15,23,42,0.55)' }}>
                      {item.note}
                    </Typography>
                  ) : null}
                </Box>

                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap justifyContent={{ md: 'flex-end' }}>
                  <Button
                    size="small"
                    component={Link}
                    href={`/deals/${encodeURIComponent(item.dealId)}`}
                  >
                    {language === 'zh' ? '攻略' : 'Guide'}
                  </Button>
                  {editable
                    ? STATUS_META.filter((s) => s.id !== item.status).map((s) => (
                        <Button
                          key={s.id}
                          size="small"
                          onClick={() =>
                            persist(
                              items.map((x) => (x.id === item.id ? { ...x, status: s.id } : x)),
                            )
                          }
                        >
                          → {language === 'zh' ? s.zh : s.en}
                        </Button>
                      ))
                    : null}
                  {editable ? (
                    <Button
                      size="small"
                      color="inherit"
                      startIcon={<DeleteOutlineIcon fontSize="small" />}
                      onClick={() => persist(items.filter((x) => x.id !== item.id))}
                    >
                      {language === 'zh' ? '移除' : 'Remove'}
                    </Button>
                  ) : null}
                </Stack>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
