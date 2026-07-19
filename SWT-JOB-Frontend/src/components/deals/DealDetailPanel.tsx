import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  Slide,
  Alert,
} from '@mui/material';
import {
  Close,
  ContentCopy,
  OpenInNew,
  History,
  InfoOutlined,
  ForumOutlined,
} from '@mui/icons-material';
import type { TransitionProps } from '@mui/material/transitions';
import { forwardRef, useEffect, useState } from 'react';
import type { OfferKind } from '../../data/referralDeals';
import type { DealExperience } from '../../data/dealExperiences';
import { getExperiencesForProgram } from '../../lib/deals/dealExperienceStore';
import type { Language } from '../../i18n/types';
import { useI18n } from '../../context/I18nContext';
import { formatEditionPeriod, type ResolvedProgram } from '../../lib/deals/deal-utils';
import { MemberAvatarLink } from '../member/MemberAvatarLink';
import { DealExperienceForm } from './DealExperienceForm';

const PanelTransition = forwardRef(function PanelTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function pickLang(obj: { zh: string; en: string }, lang: Language): string {
  return lang === 'zh' ? obj.zh : obj.en;
}

function pickLangList(obj: { zh: string[]; en: string[] }, lang: Language): string[] {
  return lang === 'zh' ? obj.zh : obj.en;
}

function hasReferralLink(item: ResolvedProgram): boolean {
  const url = item.edition.referralUrl;
  return item.program.offerKind === 'refer' && Boolean(url) && url !== '#';
}

function ExperienceCard({ experience, lang }: { experience: DealExperience; lang: Language }) {
  const { t } = useI18n();
  const rows: { label: string; value: string }[] = [];

  if (experience.openingMethod) {
    rows.push({
      label: t('deals.experience.openingMethod'),
      value: pickLang(experience.openingMethod, lang),
    });
  }
  if (experience.materials?.zh.length) {
    rows.push({
      label: t('deals.experience.materials'),
      value: pickLangList(experience.materials, lang).join(' · '),
    });
  }
  if (experience.ddMethod) {
    rows.push({
      label: t('deals.experience.ddMethod'),
      value: pickLang(experience.ddMethod, lang),
    });
  }
  if (experience.ddDate) {
    rows.push({ label: t('deals.experience.ddDate'), value: experience.ddDate });
  }
  if (experience.bonusReceivedDate) {
    rows.push({
      label: t('deals.experience.bonusReceivedDate'),
      value: experience.bonusReceivedDate,
    });
  }
  if (experience.bonusAmount) {
    rows.push({ label: t('deals.experience.bonusAmount'), value: experience.bonusAmount });
  }

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        <MemberAvatarLink
          userId={experience.userId}
          size={32}
          displayName={experience.authorDisplayName}
          avatarUrl={experience.authorAvatarUrl}
          avatarColor={experience.authorAvatarColor}
        />
        <Typography variant="caption" color="text.secondary">
          {experience.reportedAt}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: rows.length ? 1.5 : 0, lineHeight: 1.6 }}>
        {pickLang(experience.body, lang)}
      </Typography>

      {rows.length ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' },
            gap: 0.75,
            mt: 1,
            pt: 1.5,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {rows.map((row) => (
            <Box key={row.label} sx={{ display: 'contents' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {row.label}
              </Typography>
              <Typography variant="caption" color="text.primary">
                {row.value}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

interface DealDetailPanelProps {
  open: boolean;
  item: ResolvedProgram | null;
  onClose: () => void;
  onCopy: (url: string, title: string) => void;
  onOpenExternal: (url: string, title: string) => void;
  onViewHistory: () => void;
}

export default function DealDetailPanel({
  open,
  item,
  onClose,
  onCopy,
  onOpenExternal,
  onViewHistory,
}: DealDetailPanelProps) {
  const { t, tWithParams, language } = useI18n();
  const [experiences, setExperiences] = useState<DealExperience[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const programId = item?.program.id;
  const editionId = item?.edition.id;

  useEffect(() => {
    if (!open || !programId || !editionId) return;
    let cancelled = false;
    setLoadingExperiences(true);
    void getExperiencesForProgram(programId, editionId)
      .then((list) => {
        if (!cancelled) setExperiences(list);
      })
      .catch(() => {
        if (!cancelled) setExperiences([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingExperiences(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, programId, editionId, refreshKey]);

  if (!item) return null;

  const { program, edition, status, isStale, daysUntilExpiry } = item;
  const title = pickLang(program.brandName, language);
  const reward = pickLang(edition.reward, language);
  const summary = pickLang(edition.summary, language);
  const requirements = pickLangList(edition.requirements, language);
  const tags = edition.tags ? pickLangList(edition.tags, language) : [];
  const showReferral = hasReferralLink(item);
  const period = formatEditionPeriod(edition, language);
  const offerKind = program.offerKind as OfferKind;
  const officialUrl = edition.officialUrl;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      slots={{ transition: PanelTransition }}
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)', bgcolor: 'rgba(0,0,0,0.45)' },
        },
        paper: {
          sx: {
            borderRadius: 3,
            boxShadow: 24,
            maxHeight: 'min(90vh, 820px)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 'min(90vh, 820px)' }}>
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: isStale ? 'action.hover' : 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Typography variant="h5" fontWeight={800}>
                  {title}
                </Typography>
                {officialUrl ? (
                  <Tooltip title={t('deals.officialInfo')}>
                    <IconButton
                      size="small"
                      aria-label={t('deals.officialInfo')}
                      onClick={() => onOpenExternal(officialUrl, t('deals.officialTerms'))}
                    >
                      <InfoOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ color: isStale ? 'text.disabled' : 'primary.main', lineHeight: 1.15 }}
              >
                {reward}
              </Typography>
            </Box>
            <IconButton onClick={onClose} aria-label={t('common.close')} sx={{ mt: -0.5 }}>
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
            <Chip
              size="small"
              label={t(`deals.offerKind.${offerKind}`)}
              variant="outlined"
              color={offerKind === 'refer' ? 'primary' : 'default'}
            />
            {edition.requiresInPerson ? (
              <Chip size="small" label={t('deals.inPersonOnly')} variant="outlined" />
            ) : null}
            {tags.map((tag) => (
              <Chip key={tag} size="small" label={tag} variant="outlined" />
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {period}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2.5 }}>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, mb: 2 }}>
            {summary}
          </Typography>

          {isStale ? (
            <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
              {t('deals.staleHint')}
            </Alert>
          ) : null}

          {!isStale && edition.validUntil && daysUntilExpiry !== null && daysUntilExpiry >= 0 ? (
            <Typography
              variant="caption"
              color={status === 'expiring' ? 'warning.main' : 'text.secondary'}
              display="block"
              sx={{ mb: 2 }}
            >
              {status === 'expiring'
                ? tWithParams('deals.expiresInDays', { days: daysUntilExpiry })
                : tWithParams('deals.expiresOn', { date: edition.validUntil })}
            </Typography>
          ) : null}

          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            {t('deals.timeline.requirements')}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 2.5 }}>
            {requirements.map((req) => (
              <Typography component="li" variant="body2" color="text.secondary" key={req} sx={{ mb: 0.5 }}>
                {req}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {!isStale && showReferral ? (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<OpenInNew />}
                  onClick={() => onOpenExternal(edition.referralUrl!, title)}
                >
                  {t('deals.openReferralLink')}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopy />}
                  onClick={() => onCopy(edition.referralUrl!, title)}
                >
                  {t('deals.copyReferralLink')}
                </Button>
              </>
            ) : null}
            {program.editions.length > 1 ? (
              <Button variant="outlined" size="small" startIcon={<History />} onClick={onViewHistory}>
                {t('deals.viewHistory')}
              </Button>
            ) : null}
          </Box>

          {!isStale && !showReferral && offerKind === 'signup_bonus' ? (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
              {t('deals.signupBonusHint')}
            </Typography>
          ) : null}

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <ForumOutlined fontSize="small" color="action" />
            <Typography variant="subtitle1" fontWeight={700}>
              {t('deals.experience.title')}
            </Typography>
            {experiences.length ? (
              <Chip size="small" label={experiences.length} variant="outlined" />
            ) : null}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            {t('deals.experience.subtitle')}
          </Typography>

          <DealExperienceForm
            item={item}
            onSubmitted={() => setRefreshKey((n) => n + 1)}
          />

          {loadingExperiences ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('common.loading')}
            </Typography>
          ) : null}

          {!loadingExperiences && experiences.length ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {experiences.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} lang={language} />
              ))}
            </Box>
          ) : !loadingExperiences ? (
            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderStyle: 'dashed',
                borderRadius: 2,
                p: 2.5,
                textAlign: 'center',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('deals.experience.empty')}
              </Typography>
            </Box>
          ) : null}

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            {t('deals.experience.disclaimer')}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
