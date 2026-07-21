import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Close, OpenInNew } from '@mui/icons-material';

import ExternalLinkDialog from './ExternalLinkDialog';
import DealHistoryDialog from './DealHistoryDialog';
import { useI18n } from '../../context/I18nContext';
import type { Language } from '../../i18n/types';
import {
  formatEditionPeriod,
  resolveProgram,
  type ResolvedProgram,
} from '../../lib/deals/deal-utils';
import type { ReferralProgram } from '../../data/referralDeals';
import { openExternalUrl } from '../../lib/openExternalUrl';

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
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
        {steps.map((step) => (
          <Typography component="li" variant="body2" key={step} sx={{ mb: 1, lineHeight: 1.6 }}>
            {step}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

type DealGuideDrawerProps = {
  open: boolean;
  onClose: () => void;
  program: ReferralProgram | null;
};

export default function DealGuideDrawer({ open, onClose, program }: DealGuideDrawerProps) {
  const { t, language } = useI18n();
  const lang = language as Language;
  const resolved: ResolvedProgram | null = program ? resolveProgram(program) : null;

  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [externalLink, setExternalLink] = React.useState<{ url: string; label: string } | null>(null);

  React.useEffect(() => {
    if (!open) {
      setHistoryOpen(false);
      setExternalLink(null);
    }
  }, [open]);

  const handleConfirmExternal = () => {
    if (externalLink?.url) {
      openExternalUrl(externalLink.url);
    }
    setExternalLink(null);
  };

  if (!program || !resolved) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary">{t('deals.detailNotFound')}</Typography>
        </Box>
      </Drawer>
    );
  }

  const { edition, isStale } = resolved;
  const title = pickLang(program.brandName, lang);
  const siteRebateLabel =
    program.siteRebateLabel?.[lang] ||
    (program.siteRebateUsd != null
      ? lang === 'zh'
        ? `约 $${program.siteRebateUsd}（以管理员设置为准）`
        : `About $${program.siteRebateUsd}`
      : t('deals.siteRebateTbd'));

  const howToClaim = pickLangList(program.howToClaim, lang);
  const practicalSteps = pickLangList(program.practicalSteps, lang);
  const requirements = pickLangList(edition.requirements, lang);
  const officialDetail = program.officialDetail ? pickLang(program.officialDetail, lang) : '';

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 440, md: 480 },
            maxWidth: '100vw',
          },
        }}
      >
        <Stack sx={{ height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary">
                {t('deals.viewGuide')}
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {title}
              </Typography>
              <Typography variant="subtitle1" color="primary.main" fontWeight={700}>
                {pickLang(edition.reward, lang)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {formatEditionPeriod(edition, lang)}
              </Typography>
            </Box>
            <IconButton onClick={onClose} aria-label="close">
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Stack spacing={2.5}>
              {isStale ? <Alert severity="warning">{t('deals.staleHint')}</Alert> : null}

              {!isStale ? (
                <Alert severity="info" icon={false} sx={{ border: 1, borderColor: 'primary.light' }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t('deals.siteRebateTitle')}
                  </Typography>
                  <Typography variant="body1" fontWeight={800} color="primary.main">
                    {siteRebateLabel}
                  </Typography>
                </Alert>
              ) : null}

              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
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
              <StepList title={t('deals.officialRequirements')} steps={requirements} />

              <Stack direction="column" spacing={1}>
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
                    onClick={() =>
                      setExternalLink({ url: edition.officialUrl!, label: t('deals.officialTerms') })
                    }
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
          </Box>
        </Stack>
      </Drawer>

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
    </>
  );
}
