import React from 'react';
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useI18n } from '../../context/I18nContext';
import { SUPPORTED_LANGUAGES, type Language } from '../../i18n/types';

type LanguageMenuProps = {
  iconButtonSx?: object;
};

export function LanguageMenu({ iconButtonSx }: LanguageMenuProps) {
  const { language, setLanguage, t } = useI18n();
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const current = SUPPORTED_LANGUAGES.find((item) => item.code === language);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setAnchor(null);
  };

  return (
    <>
      <Tooltip title={`${t('language.switch')}${current ? ` · ${current.flag} ${current.nativeName}` : ''}`}>
        <IconButton
          size="small"
          onClick={(e) => setAnchor(e.currentTarget)}
          color="inherit"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 999,
            ...iconButtonSx,
          }}
        >
          <span className="text-base leading-none">{current?.flag ?? '🌐'}</span>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{
          paper: {
            sx: { maxHeight: 360, minWidth: 220 },
          },
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={language === lang.code}
            onClick={() => handleSelect(lang.code)}
            sx={{ gap: 1 }}
          >
            <span>{lang.flag}</span>
            <span className="flex-1">{lang.nativeName}</span>
            <span className="text-xs text-neutral-500">{lang.region}</span>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
