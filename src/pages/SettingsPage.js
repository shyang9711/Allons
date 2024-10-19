import React from 'react';
import { Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, Switch, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'ja', name: '日本語' },
];

function SettingsPage({ toggleDarkMode, isDarkMode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    i18n.changeLanguage(newLang);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ alignSelf: 'flex-start', mb: 2 }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography component="h1" variant="h5">
          {t('settings')}
        </Typography>
        <Box sx={{ mt: 3, width: '100%' }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="language-select-label">{t('language')}</InputLabel>
            <Select
              labelId="language-select-label"
              id="language-select"
              value={i18n.language}
              label={t('language')}
              onChange={handleLanguageChange}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography>{t('darkMode')}</Typography>
            <Switch
              checked={isDarkMode}
              onChange={toggleDarkMode}
              inputProps={{ 'aria-label': 'toggle dark mode' }}
            />
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default SettingsPage;
