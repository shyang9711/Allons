import React from 'react';
import { Typography, Autocomplete, TextField, Chip } from '@mui/material';

function LanguagePreferenceModel({ languages, setLanguages, profile=false,onAddLanguage, onRemoveLanguage }) {
  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Chinese', 'Japanese', 'Korean',
    'Arabic', 'Russian', 'Portuguese', 'Hindi', 'Dutch', 'Swedish', 'Greek', 'Turkish'
  ];

  const handleChange = (event, newValue) => {
    // Prevent deselecting the last language
    if (newValue.length === 0) {
      return;
    }

    const added = newValue.filter(lang => !languages.includes(lang));
    const removed = languages.filter(lang => !newValue.includes(lang));
    if (profile) {
        if (added.length > 0) {
            onAddLanguage(added[0]);
          } else if (removed.length > 0) {
            onRemoveLanguage(removed[0]);
          }
    }

    setLanguages(newValue);
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>Language Preference</Typography>
      <Autocomplete
        multiple
        id="language-preference"
        options={languageOptions}
        value={languages}
        onChange={handleChange}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Select Languages"
            placeholder="Languages"
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              label={option}
              {...getTagProps({ index })}
              onDelete={languages.length === 1 ? undefined : getTagProps({ index }).onDelete}
            />
          ))
        }
      />
    </>
  );
}

export default LanguagePreferenceModel;
