import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
} from '@mui/material';
import { SUPPORTED_LANGUAGES } from '@/i18n/config';

type LanguageSwitcherProps = {
  className?: string;
  dense?: boolean;
};

export default function LanguageSwitcher(props: LanguageSwitcherProps) {
  const { className = '', dense = true } = props;
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem('panel_lng', code);
      localStorage.setItem('i18nextLng', code);
      localStorage.setItem('panel_default_de_v2', 'true');
    } catch {
      // ignore storage access errors
    }
    handleClose();
  };

  const currentLang =
    SUPPORTED_LANGUAGES.find((lang) => i18n.language?.startsWith(lang.code)) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <>
      <Tooltip title={t('header.language', 'Language')} arrow>
        <Button
          onClick={handleClick}
          size="small"
          className={`min-w-0 px-2 py-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`}
          aria-label={t('header.language', 'Change Language')}
          aria-controls={open ? 'language-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          sx={{
            textTransform: 'none',
            color: 'inherit',
          }}
        >
          <span className="text-base leading-none mr-1.5">{currentLang.flag}</span>
          <Typography variant="caption" className="font-bold text-xs">
            {currentLang.tag}
          </Typography>
        </Button>
      </Tooltip>

      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 150,
              mt: 1,
              borderRadius: 2,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            },
          },
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = currentLang.code === lang.code;
          return (
            <MenuItem
              key={lang.code}
              selected={isSelected}
              onClick={() => handleSelectLanguage(lang.code)}
              className="py-2 px-3 text-xs"
            >
              <ListItemIcon sx={{ minWidth: '32px !important' }}>
                <span className="text-lg leading-none">{lang.flag}</span>
              </ListItemIcon>
              <ListItemText
                primary={lang.label}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.8125rem',
                }}
              />
              {isSelected && (
                <Typography variant="caption" className="text-brand font-bold ml-2">
                  ✓
                </Typography>
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
