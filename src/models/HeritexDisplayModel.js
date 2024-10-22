import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import '../css/HeritexDisplayModel.css'; // Add this import
import { getCountryCode } from '../utils/countryUtils'; // We'll create this utility function

const HeritexDisplayModel = ({ allHeritex, userHeritex, onHeritexClick }) => {
  console.log('User Heritex:', userHeritex);

  const getBackgroundColor = (isOwned, rarity) => {
    if (!isOwned) return '#808080'; // Using hex for gray
    switch (rarity?.toLowerCase()) {
      case 'common': return 'linear-gradient(135deg, #996848, #a17652)'; // Bronze gradient
      case 'uncommon': return 'linear-gradient(135deg, #a6a9aa, #c0c2c4)'; // Silver gradient
      case 'rare': return 'linear-gradient(135deg, #b49b57, #c2b38c)'; // Gold gradient
      case 'legend': return 'linear-gradient(135deg, #d5ccb5 , #ffffff)'; // White
      default: return '#808080'; // Gray
    }
  };

  return (
    <Grid container spacing={3} className="heritex-grid">
      {allHeritex.map((heritex) => {
        const isOwned = userHeritex.hasOwnProperty(heritex.id);
        const backgroundColor = getBackgroundColor(isOwned, heritex.rarity);
        const isLegendary = heritex.rarity?.toLowerCase() === 'legend';
        
        return (
          <Grid item xs={4} key={heritex.id} className="heritex-box-container">
            <Paper 
              className={`heritex-box ${isOwned ? 'owned' : ''}`}
              onClick={() => onHeritexClick(heritex)}
              style={{ 
                background: backgroundColor,
                border: isLegendary && isOwned ? '5px solid #b49b57' : '5px solid transparent',
              }}
            >
              {isOwned ? (
                <div className="heritex-content">
                  <div className="heritex-image-container">
                    <div className="heritex-id-flag-container">
                      <Typography 
                        variant="h6"
                        className="heritex-id"
                        style={isLegendary ? {
                          WebkitTextStroke: '1px #b49b57',
                          textStroke: '1px #b49b57',
                          color: '#b49b57',
                          fontWeight: 'bold',
                        } : {}}
                      >
                        {heritex.id}
                      </Typography>
                      {heritex.countries && heritex.countries.length > 0 && (
                        <img
                          src={require(`../../assets/flag-icons/${getCountryCode(heritex.countries[0]).toLowerCase()}.png`).default}
                          alt={`${heritex.countries[0]} flag`}
                          className="heritex-flag"
                          title={heritex.countries[0]}
                        />
                      )}
                    </div>
                    <div className="heritex-icon-container">
                      <ImageIcon className="heritex-icon" style={{ height: '175px', width: '175px' }} />
                    </div>
                    <div className="heritex-right-spacer"></div>
                  </div>
                  <Typography 
                    variant="h6" 
                    className="heritex-name"
                    style={isLegendary ? {
                      WebkitTextStroke: '1px #b49b57',
                      textStroke: '1px #b49b57',
                      color: '#b49b57',
                      fontWeight: 'bold',
                    } : {}}
                  >
                    {heritex.name}
                  </Typography>
                </div>
              ) : (
                <Typography variant="h6" className="heritex-id">
                  {heritex.id}
                </Typography>
              )}
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default HeritexDisplayModel;
