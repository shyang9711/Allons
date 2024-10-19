import React from 'react';
import { Typography, Box, Slider } from '@mui/material';

function AgeRangeModel({ ageRange, setAgeRange }) {
  const handleAgeRangeChange = (event, newValue) => {
    setAgeRange(newValue);
  };

  const ageMarks = [
    { value: 18, label: '18' },
    { value: 30, label: '30' },
    { value: 45, label: '45' },
    { value: 60, label: '60+' },
  ];

  return (
    <>
      <Typography variant="h6" gutterBottom>Age Range</Typography>
      <Box px={2}>
        <Slider
          value={ageRange}
          onChange={handleAgeRangeChange}
          valueLabelDisplay="auto"
          min={18}
          max={60}
          marks={ageMarks}
        />
      </Box>
      <Typography variant="body2" align="center">
        {ageRange[0]} - {ageRange[1] === 60 ? '60+' : ageRange[1]}
      </Typography>
    </>
  );
}

export default AgeRangeModel;
