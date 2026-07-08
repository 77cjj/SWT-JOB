import {
  Box,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
} from '@mui/material';
import { Close, History } from '@mui/icons-material';
import type { ReferralProgram } from '../../data/referralDeals';
import type { Language } from '../../i18n/types';
import { useI18n } from '../../context/I18nContext';
import {
  formatEditionPeriod,
  getEditionTimelineRole,
  sortedEditionsForTimeline,
  type ResolvedProgram,
} from '../../lib/deals/deal-utils';

function pickLang(obj: { zh: string; en: string }, lang: Language): string {
  return lang === 'zh' ? obj.zh : obj.en;
}

function pickLangList(obj: { zh: string[]; en: string[] }, lang: Language): string[] {
  return lang === 'zh' ? obj.zh : obj.en;
}

interface DealHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  program: ReferralProgram | null;
  resolved: ResolvedProgram | null;
}

function roleChip(
  role: 'current' | 'past' | 'future',
  t: (k: string) => string,
): { label: string; color: 'success' | 'default' | 'info' } {
  if (role === 'current') return { label: t('deals.timeline.current'), color: 'success' };
  if (role === 'future') return { label: t('deals.timeline.future'), color: 'info' };
  return { label: t('deals.timeline.past'), color: 'default' };
}

export default function DealHistoryDialog({
  open,
  onClose,
  program,
  resolved,
}: DealHistoryDialogProps) {
  const { t, tWithParams, language } = useI18n();

  if (!program || !resolved) return null;

  const brand = pickLang(program.brandName, language);
  const editions = sortedEditionsForTimeline(program);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History fontSize="small" color="action" />
          <span>{tWithParams('deals.timeline.title', { brand })}</span>
        </Box>
        <IconButton onClick={onClose} aria-label={t('common.close')} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('deals.timeline.subtitle')}
        </Typography>

        <Box sx={{ position: 'relative', pl: 3 }}>
          {editions.map((edition, index) => {
            const role = getEditionTimelineRole(edition, resolved);
            const chip = roleChip(role, t);
            const isLast = index === editions.length - 1;

            return (
              <Box key={edition.id} sx={{ position: 'relative', pb: isLast ? 0 : 3 }}>
                {!isLast ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: -17,
                      top: 14,
                      bottom: 0,
                      width: 2,
                      bgcolor: 'divider',
                    }}
                  />
                ) : null}
                <Box
                  sx={{
                    position: 'absolute',
                    left: -22,
                    top: 4,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor:
                      role === 'current'
                        ? 'success.main'
                        : role === 'future'
                          ? 'info.main'
                          : 'grey.400',
                    border: 2,
                    borderColor: 'background.paper',
                    boxShadow: 1,
                  }}
                />

                <Box
                  sx={{
                    border: 1,
                    borderColor: role === 'current' ? 'success.main' : 'divider',
                    borderRadius: 2,
                    p: 2,
                    bgcolor: role === 'current' ? 'action.selected' : 'background.paper',
                    ...(role === 'past' && { opacity: 0.92 }),
                  }}
                >
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {formatEditionPeriod(edition, language)}
                    </Typography>
                    <Chip size="small" label={chip.label} color={chip.color} variant="outlined" />
                  </Box>

                  <Typography variant="h6" color="primary.main" fontWeight={800} gutterBottom>
                    {pickLang(edition.reward, language)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {pickLang(edition.summary, language)}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    display="block"
                    sx={{ mb: 0.5 }}
                  >
                    {t('deals.timeline.requirements')}
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 1.5 }}>
                    {pickLangList(edition.requirements, language).map((req) => (
                      <Typography component="li" variant="body2" key={req} color="text.secondary">
                        {req}
                      </Typography>
                    ))}
                  </Box>

                  {edition.changeNote ? (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        {t('deals.timeline.changeNote')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pickLang(edition.changeNote, language)}
                      </Typography>
                    </>
                  ) : null}
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
