'use client';

import { useMemo, useState } from 'react';
import {
  Avatar,
  AvatarGroup,
  Box,
  Chip,
  IconButton,
  List,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerifiedIcon from '@mui/icons-material/Verified';
import Link from 'next/link';
import type { JobIntelSource, IntelContributor } from '../../types/intelSource';
import { getDemoMember } from '../../lib/member/demoUsers';
import { useI18n } from '../../context/I18nContext';

const OFFICIAL_USER_ID = 'official-swt';

function formatContributedAt(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function roleLabel(t: (k: string) => string, role?: IntelContributor['role']) {
  if (role === 'verifier') return t('historicalJobs.contributorRoleVerifier');
  if (role === 'editor') return t('historicalJobs.contributorRoleEditor');
  if (role === 'primary') return t('historicalJobs.contributorRolePrimary');
  return t('historicalJobs.contributorRoleDefault');
}

function ContributorRow({
  contributor,
  locale,
}: {
  contributor: IntelContributor;
  locale: string;
}) {
  const { t } = useI18n();
  const member = getDemoMember(contributor.userId);
  if (!member) return null;

  return (
    <Box
      component={Link}
      href={`/u/${member.id}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        py: 0.75,
        px: 1,
        borderRadius: 1,
        textDecoration: 'none',
        color: 'inherit',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Avatar sx={{ bgcolor: member.avatarColor, width: 36, height: 36 }}>
        {member.displayName.slice(0, 1)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600}>
          {member.displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {roleLabel(t, contributor.role)} · {formatContributedAt(contributor.contributedAt, locale)}
        </Typography>
      </Box>
    </Box>
  );
}

export function IntelSourceContributors({ source }: { source: JobIntelSource }) {
  const { t, tWithParams, language } = useI18n();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const sorted = useMemo(
    () =>
      [...source.contributors].sort(
        (a, b) => new Date(b.contributedAt).getTime() - new Date(a.contributedAt).getTime(),
      ),
    [source.contributors],
  );

  const isOfficial = source.kind === 'official';
  const primaryUserId = isOfficial ? OFFICIAL_USER_ID : sorted[0]?.userId;
  const primaryMember = primaryUserId ? getDemoMember(primaryUserId) : null;
  const multi = sorted.length > 1;

  if (!primaryMember && sorted.length === 0) return null;

  return (
    <Box sx={{ textAlign: 'right', minWidth: 0, flexShrink: 0, position: 'relative' }}>
      <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end">
        {isOfficial ? (
          <Chip
            size="small"
            icon={<VerifiedIcon sx={{ fontSize: '16px !important' }} />}
            label={source.officialLabel ?? primaryMember?.displayName ?? t('historicalJobs.sourceOfficial')}
            variant="outlined"
            color="primary"
          />
        ) : (
          <Chip size="small" label={t('historicalJobs.sourceCommunity')} variant="outlined" />
        )}

        {primaryMember ? (
          <Tooltip title={t('historicalJobs.viewProfileContact')}>
            <Avatar
              component={Link}
              href={`/u/${primaryMember.id}`}
              sx={{
                width: 32,
                height: 32,
                bgcolor: primaryMember.avatarColor,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {primaryMember.displayName.slice(0, 1)}
            </Avatar>
          </Tooltip>
        ) : null}

        {multi ? (
          <>
            <IconButton
              size="small"
              aria-label={t('historicalJobs.allContributors')}
              aria-expanded={Boolean(anchorEl)}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ ml: -0.5 }}
            >
              <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } }}>
                {sorted.slice(0, 3).map((c) => {
                  const m = getDemoMember(c.userId);
                  if (!m) return null;
                  return (
                    <Avatar key={c.userId} sx={{ bgcolor: m.avatarColor }}>
                      {m.displayName.slice(0, 1)}
                    </Avatar>
                  );
                })}
              </AvatarGroup>
              <ExpandMoreIcon
                fontSize="small"
                sx={{
                  transform: anchorEl ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </IconButton>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {tWithParams('historicalJobs.contributorCount', { count: sorted.length })}
            </Typography>
          </>
        ) : sorted.length === 1 ? (
          <Typography variant="caption" color="text.secondary">
            {tWithParams('historicalJobs.contributorCount', { count: 1 })}
          </Typography>
        ) : null}
      </Stack>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: 300,
              maxHeight: 360,
              overflow: 'auto',
              boxShadow: 8,
            },
          },
        }}
        disableScrollLock
      >
        <Box sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            {t('historicalJobs.allContributors')}
          </Typography>
          <Stack spacing={0}>
            {sorted.map((c) => (
              <ContributorRow key={`${c.userId}-${c.contributedAt}`} contributor={c} locale={language} />
            ))}
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
}
