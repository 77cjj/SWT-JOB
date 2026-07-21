import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowBack, OpenInNew } from '@mui/icons-material';

import ExternalLinkDialog from '../components/deals/ExternalLinkDialog';
import DealHistoryDialog from '../components/deals/DealHistoryDialog';
import { useI18n } from '../context/I18nContext';
import type { Language } from '../i18n/types';
import {
  formatEditionPeriod,
  resolveProgram,
  type ResolvedProgram,
} from '../lib/deals/deal-utils';
import { findReferralProgram, useReferralPrograms } from '../lib/deals/useReferralPrograms';

function pickLang(obj: { zh: string; en: string }, lang: Language) {
  return lang === 'zh' ? obj.zh : obj.en;
}

function pickLangList(obj: { zh: string[]; en: string[] } | undefined, lang: Language) {
  if (!obj) return [] as string[];
  return lang === 'zh' ? obj.zh : obj.en;
}

function StepList({ title, steps }: { title: string; steps: string[] }) {
  if (!steps.length) return null;
  return (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
        {steps.map((step) => (
          <Typography component="li" variant="body1" key={step} sx={{ mb: 1.25, lineHeight: 1.6 }}>
            {step}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default function DealDetailPage() {
  const router = useRouter();
  const programId = typeof router.query.programId === 'string' ? router.query.programId : '';
  const { programs, loading } = useReferralPrograms();
  const { t, language } = useI18n();
  const lang = language as Language;

  const program = findReferralProgram(programs, programId);
  const resolved: ResolvedProgram | null = program ? resolveProgram(program) : null;

  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [externalLink, setExternalLink] = React.useState<{ url: string; label: string } | null>(null);

  const handleConfirmExternal = () => {
    if (externalLink) {
      window.open(externalLink.url, '_blank', 'noopener,noreferrer');
    }
    setExternalLink(null);
  };

  if (!router.isReady || loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography color="text.secondary">…</Typography>
      </Container>
    );
  }

  if (!program || !resolved) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('deals.detailNotFound')}
        </Alert>
        <Button component={Link} href="/deals" startIcon={<ArrowBack />}>
          {t('deals.backToList')}
        </Button>
      </Container>
    );
  }

  const { edition, isStale } = resolved;
  const title = pickLang(program.brandName, lang);
  const siteRebateLabel =
    program.siteRebateLabel?.[lang] ||
    (program.siteRebateUsd != null
      ? lang === 'zh'
        ? `约 $${program.siteRebateUsd}（以管理员设置为准）`
        : `About $${program.siteRebateUsd} (as configured)`
      : t('deals.siteRebateTbd'));

  const howToClaim = pickLangList(program.howToClaim, lang);
  const practicalSteps = pickLangList(program.practicalSteps, lang);
  const requirements = pickLangList(edition.requirements, lang);
  const officialDetail = program.officialDetail ? pickLang(program.officialDetail, lang) : '';

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Button component={Link} href="/deals" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        {t('deals.backToList')}
      </Button>

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {title}
          </Typography>
          <Typography variant="h5" color="primary.main" fontWeight={700}>
            {pickLang(edition.reward, lang)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {formatEditionPeriod(edition, lang)}
          </Typography>
        </Box>

        {isStale ? (
          <Alert severity="warning">{t('deals.staleHint')}</Alert>
        ) : (
          <Alert severity="info" icon={false} sx={{ border: 1, borderColor: 'primary.light' }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              {t('deals.siteRebateTitle')}
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight={800}>
              {siteRebateLabel}
            </Typography>
            {program.siteRebateUsd != null ? (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {t('deals.siteRebateAmountHint')}
              </Typography>
            ) : null}
          </Alert>
        )}

        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {pickLang(edition.summary, lang)}
        </Typography>

        {officialDetail ? (
          <Typography variant="body2" color="text.secondary">
            {officialDetail}
          </Typography>
        ) : null}

        <Divider />

        <StepList title={t('deals.howToClaimTitle')} steps={howToClaim} />
        <StepList title={t('deals.practicalStepsTitle')} steps={practicalSteps} />

        {requirements.length ? (
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {t('deals.officialRequirements')}
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
              {requirements.map((req) => (
                <Typography component="li" variant="body2" key={req} sx={{ mb: 0.75 }}>
                  {req}
                </Typography>
              ))}
            </Box>
          </Box>
        ) : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          {edition.referralUrl ? (
            <Button
              variant="contained"
              startIcon={<OpenInNew />}
              onClick={() => setExternalLink({ url: edition.referralUrl!, label: title })}
            >
              {t('deals.openReferralLink')}
            </Button>
          ) : null}
          {edition.officialUrl ? (
            <Button
              variant="outlined"
              startIcon={<OpenInNew />}
              onClick={() => setExternalLink({ url: edition.officialUrl!, label: t('deals.officialTerms') })}
            >
              {t('deals.officialInfo')}
            </Button>
          ) : null}
          {program.editions.length > 1 ? (
            <Button variant="text" onClick={() => setHistoryOpen(true)}>
              {t('deals.viewHistory')}
            </Button>
          ) : null}
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {t('deals.disclaimer')}
        </Typography>
      </Stack>

      <DealHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        program={program}
        resolved={resolved}
      />
      <ExternalLinkDialog
        open={Boolean(externalLink)}
        targetUrl={externalLink?.url ?? ''}
        targetLabel={externalLink?.label ?? ''}
        onClose={() => setExternalLink(null)}
        onConfirm={handleConfirmExternal}
      />
    </Container>
  );
}
