'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import { useAuthStore } from '@/stores/authStore';
import { storage } from '@/utils/storage';
import { RAGENT_BYPASS_AUTH } from '@/config/runtimeEnv';
import { useI18n } from '../../context/I18nContext';
import { getDocPollDefinition } from '../../lib/docs/polls/definitions';
import { parseJsonResponse } from '../../lib/api/parseJsonResponse';
import {
  isMemberProfileComplete,
  readMemberProfile,
  saveMemberProfile,
  US_STATE_OPTIONS,
  type MemberProfile,
} from '../../lib/member/profile';

type PollOptionResult = {
  id: string;
  label: { zh: string; en: string };
  count: number;
  percent: number;
};

type PollResults = {
  pollId: string;
  total: number;
  options: PollOptionResult[];
};

const PROGRAM_YEARS = ['2024', '2025', '2026', '2027'];

export function DocPollWidget({ pollId }: { pollId: string }) {
  const { t, language } = useI18n();
  const definition = getDocPollDefinition(pollId);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<PollResults | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [selected, setSelected] = useState('');
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [workState, setWorkState] = useState('');
  const [programYear, setProgramYear] = useState('2026');
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  const pickText = useCallback(
    (text: { zh: string; en: string }) => (language === 'en' ? text.en : text.zh),
    [language],
  );

  const authHeaders = useMemo((): Record<string, string> => {
    const token = storage.getToken();
    return token ? { Authorization: token } : {};
  }, [isAuthenticated, user?.token]);

  const verified = isMemberProfileComplete(profile);

  const loadPoll = useCallback(async () => {
    if (!definition) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/doc-polls/${pollId}`, {
        headers: authHeaders,
      });
      const data = await parseJsonResponse<{
        ok?: boolean;
        results?: PollResults;
        myVote?: string | null;
        message?: string;
      }>(res);
      if (!res.ok || !data.ok || !data.results) {
        throw new Error(data.message || t('docPolls.loadError'));
      }
      setResults(data.results);
      setMyVote(data.myVote ?? null);
      if (data.myVote) setSelected(data.myVote);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('docPolls.loadError'));
    } finally {
      setLoading(false);
    }
  }, [authHeaders, definition, pollId, t]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user?.userId) {
      const saved = readMemberProfile(user.userId);
      setProfile(saved);
      if (saved?.workState) setWorkState(saved.workState);
      if (saved?.programYear) setProgramYear(saved.programYear);
    }
  }, [user?.userId]);

  useEffect(() => {
    void loadPoll();
  }, [loadPoll]);

  const saveVerification = () => {
    if (!user?.userId || !workState || !programYear) return;
    const next: MemberProfile = {
      userId: user.userId,
      workState,
      programYear,
      verifiedAt: new Date().toISOString(),
    };
    saveMemberProfile(next);
    setProfile(next);
    setShowVerifyForm(false);
  };

  const submitVote = async () => {
    if (!selected || !verified || !user?.userId) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/doc-polls/${pollId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          optionId: selected,
          workState: profile.workState,
          programYear: profile.programYear,
        }),
      });
      const data = await parseJsonResponse<{
        ok?: boolean;
        results?: PollResults;
        myVote?: string;
        message?: string;
      }>(res);
      if (!res.ok || !data.ok || !data.results) {
        throw new Error(data.message || t('docPolls.submitError'));
      }
      setResults(data.results);
      setMyVote(data.myVote ?? selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('docPolls.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!definition) return null;

  const canVote = isAuthenticated || RAGENT_BYPASS_AUTH;

  return (
    <aside className="doc-poll" aria-label={pickText(definition.question)}>
      <div className="doc-poll-header">
        <HowToVoteOutlinedIcon fontSize="small" aria-hidden />
        <Typography component="h4" variant="subtitle2" className="doc-poll-title">
          {t('docPolls.badge')}
        </Typography>
      </div>

      <Typography variant="body2" className="doc-poll-question">
        {pickText(definition.question)}
      </Typography>
      {definition.hint ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          {pickText(definition.hint)}
        </Typography>
      ) : null}

      {loading ? <LinearProgress sx={{ my: 1 }} /> : null}
      {error ? <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert> : null}

      {results ? (
        <Stack spacing={1.2} className="doc-poll-results">
          {results.options.map((option) => (
            <Box key={option.id}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <Typography variant="body2">{pickText(option.label)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.percent}% · {option.count}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={option.percent}
                className={myVote === option.id ? 'doc-poll-bar--mine' : undefined}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary">
            {tWithCount(t('docPolls.totalVotes'), results.total)}
          </Typography>
        </Stack>
      ) : null}

      {!canVote ? (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          {t('docPolls.loginToVote')}{' '}
          <Link href="/login">{t('docPolls.goLogin')}</Link>
        </Alert>
      ) : null}

      {canVote && !verified && !showVerifyForm ? (
        <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => setShowVerifyForm(true)}>
          {t('docPolls.verifyToVote')}
        </Button>
      ) : null}

      {canVote && showVerifyForm && !verified ? (
        <Box className="doc-poll-verify" sx={{ mt: 1.5 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t('docPolls.verifyDesc')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t('docPolls.workState')}</InputLabel>
              <Select
                label={t('docPolls.workState')}
                value={workState}
                onChange={(e) => setWorkState(e.target.value)}
              >
                {US_STATE_OPTIONS.map((st) => (
                  <MenuItem key={st} value={st}>{st}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('docPolls.programYear')}</InputLabel>
              <Select
                label={t('docPolls.programYear')}
                value={programYear}
                onChange={(e) => setProgramYear(e.target.value)}
              >
                {PROGRAM_YEARS.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Button size="small" variant="contained" onClick={saveVerification} disabled={!workState}>
            {t('docPolls.confirmVerify')}
          </Button>
        </Box>
      ) : null}

      {canVote && verified && !myVote ? (
        <Box sx={{ mt: 1.5 }}>
          <Stack spacing={0.8}>
            {definition.options.map((option) => (
              <Button
                key={option.id}
                size="small"
                variant={selected === option.id ? 'contained' : 'outlined'}
                onClick={() => setSelected(option.id)}
                sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
              >
                {pickText(option.label)}
              </Button>
            ))}
          </Stack>
          <Button
            sx={{ mt: 1 }}
            variant="contained"
            size="small"
            disabled={!selected || submitting}
            onClick={() => void submitVote()}
          >
            {submitting ? t('docPolls.submitting') : t('docPolls.submit')}
          </Button>
        </Box>
      ) : null}

      {myVote ? (
        <Alert severity="success" sx={{ mt: 1.5 }}>
          {t('docPolls.thanks')}
        </Alert>
      ) : null}
    </aside>
  );
}

function tWithCount(template: string, count: number) {
  return template.replace('{count}', String(count));
}
