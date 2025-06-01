import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';
import { LocationOn } from '@mui/icons-material';

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string) => void;
  disabled?: boolean;
}

const countries = ['United States', 'Canada'];

const regions: { [key: string]: string[] } = {
  'United States': [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming'
  ],
  'Canada': [
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Northwest Territories',
    'Nova Scotia',
    'Nunavut',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon'
  ]
};

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({ value, onChange, disabled }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  useEffect(() => {
    // Parse existing value to set initial country and region
    if (value) {
      const [region, country] = value.split(', ').reverse();
      setSelectedCountry(country || '');
      setSelectedRegion(region || '');
    }
  }, [value]);

  const handleCountryChange = (_event: any, newValue: string | null) => {
    setSelectedCountry(newValue || '');
    setSelectedRegion('');
    if (!newValue) {
      onChange('');
    }
  };

  const handleRegionChange = (_event: any, newValue: string | null) => {
    setSelectedRegion(newValue || '');
    if (newValue && selectedCountry) {
      onChange(`${newValue}, ${selectedCountry}`);
    } else {
      onChange('');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <LocationOn sx={{ color: 'action.active' }} />
      <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
        <Autocomplete
          options={countries}
          value={selectedCountry}
          onChange={handleCountryChange}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Select country"
              fullWidth
            />
          )}
          sx={{ flex: 1 }}
        />
        <Autocomplete
          options={selectedCountry ? regions[selectedCountry] || [] : []}
          value={selectedRegion}
          onChange={handleRegionChange}
          disabled={disabled || !selectedCountry}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder={selectedCountry === 'United States' ? 'Select state' : 'Select province'}
              fullWidth
            />
          )}
          sx={{ flex: 1 }}
        />
      </Box>
    </Box>
  );
};

export default LocationAutocomplete; 