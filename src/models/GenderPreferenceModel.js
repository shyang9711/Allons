import React from 'react';
import { Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';

function GenderPreferenceMode({ genderPreference, setGenderPreference }) {
  return (
    <>
      <Typography variant="h6" gutterBottom>Gender Preference</Typography>
      <ToggleButtonGroup
        value={genderPreference}
        exclusive
        onChange={(event, newValue) => setGenderPreference(newValue)}
        fullWidth
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="man">Man</ToggleButton>
        <ToggleButton value="woman">Woman</ToggleButton>
      </ToggleButtonGroup>
    </>
  );
}

export default GenderPreferenceMode;
