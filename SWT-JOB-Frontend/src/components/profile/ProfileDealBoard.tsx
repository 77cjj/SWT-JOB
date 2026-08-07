'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'next/link';
import { useReferralPrograms } from '../../lib/deals/useReferralPrograms';
import { useI18n } from '../../context/I18nContext';
import { pickBilingual } from '../../i18n/bilingual';
import type { Language } from '../../i18n/types';

export type DealBoardColumnId = 'wishlist' | 'doing' | 'done';

export type DealBoardItem = {
  id: string;
  dealId: string;
  note: string;
};

export type DealBoardState = Record<DealBoardColumnId, DealBoardItem[]>;

const COLUMNS: { id: DealBoardColumnId; zh: string; en: string }[] = [
  { id: 'wishlist', zh: '想薅', en: 'Wishlist' },
  { id: 'doing', zh: '进行中', en: 'In progress' },
  { id: 'done', zh: '已完成', en: 'Done' },
];

function storageKey(userId: string) {
  return `swt-deal-board:${userId}`;
}

function emptyBoard(): DealBoardState {
  return { wishlist: [], doing: [], done: [] };
}

function loadBoard(userId: string): DealBoardState {
  if (typeof window === 'undefined') return emptyBoard();
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return emptyBoard();
    const parsed = JSON.parse(raw) as DealBoardState;
    return {
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      doing: Array.isArray(parsed.doing) ? parsed.doing : [],
      done: Array.isArray(parsed.done) ? parsed.done : [],
    };
  } catch {
    return emptyBoard();
  }
}

function saveBoard(userId: string, board: DealBoardState) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(board));
  } catch {
    // ignore
  }
}

function newItemId() {
  return `db_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

type ProfileDealBoardProps = {
  userId: string;
  language: Language;
  editable: boolean;
};

export default function ProfileDealBoard({ userId, language, editable }: ProfileDealBoardProps) {
  const { t } = useI18n();
  const { programs } = useReferralPrograms();
  const [board, setBoard] = useState<DealBoardState>(emptyBoard);
  const [pickDealId, setPickDealId] = useState('');
  const [targetColumn, setTargetColumn] = useState<DealBoardColumnId>('wishlist');

  useEffect(() => {
    setBoard(loadBoard(userId));
  }, [userId]);

  const titleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of programs) {
      map.set(p.id, pickBilingual(p.brandName, language));
    }
    return map;
  }, [programs, language]);

  const persist = (next: DealBoardState) => {
    setBoard(next);
    saveBoard(userId, next);
  };

  const addItem = () => {
    if (!pickDealId) return;
    const item: DealBoardItem = { id: newItemId(), dealId: pickDealId, note: '' };
    persist({
      ...board,
      [targetColumn]: [...board[targetColumn], item],
    });
    setPickDealId('');
  };

  const moveItem = (from: DealBoardColumnId, itemId: string, to: DealBoardColumnId) => {
    if (from === to) return;
    const item = board[from].find((x) => x.id === itemId);
    if (!item) return;
    persist({
      ...board,
      [from]: board[from].filter((x) => x.id !== itemId),
      [to]: [...board[to], item],
    });
  };

  const removeItem = (column: DealBoardColumnId, itemId: string) => {
    persist({
      ...board,
      [column]: board[column].filter((x) => x.id !== itemId),
    });
  };

  const updateNote = (column: DealBoardColumnId, itemId: string, note: string) => {
    persist({
      ...board,
      [column]: board[column].map((x) => (x.id === itemId ? { ...x, note } : x)),
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, height: '100%' }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {language === 'zh' ? '薅羊毛看板' : 'Deals board'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {language === 'zh'
              ? '把感兴趣的项目拖到「想薅 / 进行中 / 已完成」，和列表页联动跟进。'
              : 'Track deals across Wishlist / In progress / Done — linked to the deals catalog.'}
          </Typography>
        </Box>

        {editable ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <TextField
              select
              size="small"
              label={language === 'zh' ? '选择项目' : 'Pick a deal'}
              value={pickDealId}
              onChange={(e) => setPickDealId(e.target.value)}
              sx={{ minWidth: 180, flex: 1 }}
            >
              {programs.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {pickBilingual(p.brandName, language)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label={language === 'zh' ? '放入列' : 'Column'}
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value as DealBoardColumnId)}
              sx={{ width: 140 }}
            >
              {COLUMNS.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {language === 'zh' ? c.zh : c.en}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" startIcon={<AddIcon />} onClick={addItem} disabled={!pickDealId}>
              {language === 'zh' ? '添加' : 'Add'}
            </Button>
            <Button component={Link} href="/deals" size="small" endIcon={<OpenInNewIcon />}>
              {t('nav.deals')}
            </Button>
          </Stack>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.5,
            alignItems: 'start',
          }}
        >
          {COLUMNS.map((col) => (
            <Box
              key={col.id}
              sx={{
                bgcolor: 'action.hover',
                borderRadius: 2,
                p: 1.25,
                minHeight: 220,
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1, px: 0.5 }}>
                {language === 'zh' ? col.zh : col.en}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                  {board[col.id].length}
                </Typography>
              </Typography>
              <Stack spacing={1}>
                {board[col.id].length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                    {language === 'zh' ? '暂无卡片' : 'No cards yet'}
                  </Typography>
                ) : null}
                {board[col.id].map((item) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                    <Stack spacing={0.75}>
                      <Typography variant="body2" fontWeight={700}>
                        {titleById.get(item.dealId) || item.dealId}
                      </Typography>
                      {editable ? (
                        <TextField
                          size="small"
                          placeholder={language === 'zh' ? '备注（可选）' : 'Note (optional)'}
                          value={item.note}
                          onChange={(e) => updateNote(col.id, item.id, e.target.value)}
                          fullWidth
                        />
                      ) : item.note ? (
                        <Typography variant="caption" color="text.secondary">
                          {item.note}
                        </Typography>
                      ) : null}
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        <Button
                          size="small"
                          component={Link}
                          href={`/deals/${encodeURIComponent(item.dealId)}`}
                        >
                          {language === 'zh' ? '攻略' : 'Guide'}
                        </Button>
                        {editable
                          ? COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                              <Button
                                key={c.id}
                                size="small"
                                onClick={() => moveItem(col.id, item.id, c.id)}
                              >
                                → {language === 'zh' ? c.zh : c.en}
                              </Button>
                            ))
                          : null}
                        {editable ? (
                          <Button
                            size="small"
                            color="inherit"
                            startIcon={<DeleteOutlineIcon fontSize="small" />}
                            onClick={() => removeItem(col.id, item.id)}
                          >
                            {language === 'zh' ? '移除' : 'Remove'}
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
      </Stack>
    </Paper>
  );
}
