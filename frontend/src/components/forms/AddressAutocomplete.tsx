import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Chip,
  Stack,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  Alert,
} from '@mui/material';
import {
  LocationOnOutlined,
  PublicOutlined,
  BoltOutlined,
  EditLocationOutlined,
  CheckCircleOutline,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  errors?: Record<string, any>;
  disabled?: boolean;
}

// 14 official Czech administrative regions (Kraje) + standard capitals for fast selection
const CZECH_REGIONS = [
  { name: 'Hlavní město Praha (Prague)', city: 'Prague', zip: '110 00' },
  { name: 'Jihomoravský kraj (Brno)', city: 'Brno', zip: '602 00' },
  { name: 'Moravskoslezský kraj (Ostrava)', city: 'Ostrava', zip: '702 00' },
  { name: 'Plzeňský kraj (Pilsen)', city: 'Plzeň', zip: '301 00' },
  { name: 'Olomoucký kraj (Olomouc)', city: 'Olomouc', zip: '779 00' },
  { name: 'Liberecký kraj (Liberec)', city: 'Liberec', zip: '460 01' },
  { name: 'Ústecký kraj (Ústí nad Labem)', city: 'Ústí nad Labem', zip: '400 01' },
  { name: 'Královéhradecký kraj (Hradec Králové)', city: 'Hradec Králové', zip: '500 02' },
  { name: 'Pardubický kraj (Pardubice)', city: 'Pardubice', zip: '530 02' },
  { name: 'Jihočeský kraj (České Budějovice)', city: 'České Budějovice', zip: '370 01' },
  { name: 'Středočeský kraj (Central Bohemia)', city: 'Kladno', zip: '272 01' },
  { name: 'Kraj Vysočina (Jihlava)', city: 'Jihlava', zip: '586 01' },
  { name: 'Karlovarský kraj (Karlovy Vary)', city: 'Karlovy Vary', zip: '360 01' },
  { name: 'Zlínský kraj (Zlín)', city: 'Zlín', zip: '760 01' },
];

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  errors = {},
  disabled = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mode, setMode] = useState<'global' | 'czech_preset'>('global');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global search via OpenStreetMap Photon API with fallback to Nominatim
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3 || mode !== 'global') {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Primary worldwide geocoding engine: Photon (OSM-backed, ultra fast)
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=6`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            setSuggestions(
              data.features.map((f: any) => ({
                source: 'photon',
                primary: [f.properties?.name, f.properties?.street, f.properties?.housenumber]
                  .filter(Boolean)
                  .join(' '),
                secondary: [
                  f.properties?.city || f.properties?.town || f.properties?.district,
                  f.properties?.state,
                  f.properties?.country,
                ]
                  .filter(Boolean)
                  .join(', '),
                raw: f,
              }))
            );
            setShowDropdown(true);
            return;
          }
        }

        // Secondary fallback worldwide geocoding engine: OpenStreetMap Nominatim
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            searchQuery
          )}&format=json&addressdetails=1&limit=6`
        );
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (Array.isArray(nomData) && nomData.length > 0) {
            setSuggestions(
              nomData.map((item: any) => ({
                source: 'nominatim',
                primary: item.display_name.split(',')[0],
                secondary: item.display_name.split(',').slice(1).join(',').trim(),
                raw: item,
              }))
            );
            setShowDropdown(true);
          }
        }
      } catch (err) {
        // Fallback gracefully on network issues
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: any) => {
    if (suggestion.source === 'photon') {
      const props = suggestion.raw?.properties || {};
      let streetName = props.street || props.name || '';
      if (props.housenumber) {
        streetName = `${streetName} ${props.housenumber}`.trim();
      }

      const city = props.city || props.town || props.district || props.county || '';
      const state = props.state || props.county || '';
      const zipCode = props.postcode || '';
      const country = props.country || 'Czech Republic';

      onChange({
        street: streetName || value.street,
        city: city || value.city,
        state: state || value.state,
        zipCode: zipCode || value.zipCode,
        country: country || value.country,
      });
    } else if (suggestion.source === 'nominatim') {
      const addr = suggestion.raw?.address || {};
      const streetName = [addr.road || addr.pedestrian || addr.street, addr.house_number]
        .filter(Boolean)
        .join(' ');
      const city = addr.city || addr.town || addr.municipality || addr.village || '';
      const state = addr.state || addr.province || addr.region || '';
      const zipCode = addr.postcode || '';
      const country = addr.country || 'Czech Republic';

      onChange({
        street: streetName || value.street,
        city: city || value.city,
        state: state || value.state,
        zipCode: zipCode || value.zipCode,
        country: country || value.country,
      });
    }

    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleApplyCzechPreset = (regionName: string) => {
    const found = CZECH_REGIONS.find((r) => r.name === regionName);
    if (found) {
      onChange({
        ...value,
        state: found.name.split(' (')[0],
        city: found.city,
        zipCode: found.zip,
        country: 'Czech Republic',
      });
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Mode Switcher & Assistant Bar */}
      <Box
        sx={{
          mb: 2.5,
          p: 1.5,
          borderRadius: '12px',
          backgroundColor:
            theme.palette.mode === 'light' ? 'rgba(79, 70, 229, 0.04)' : 'rgba(79, 70, 229, 0.1)',
          border: '1px solid rgba(79, 70, 229, 0.15)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PublicOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" component="span" sx={{ fontWeight: 700 }}>
              {t('addressAssistant.title', { defaultValue: 'Smart Address Assistant (Global & Czechia)' })}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={mode === 'global' ? 'contained' : 'outlined'}
              onClick={() => setMode('global')}
              sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem', py: 0.3 }}
            >
              {t('addressAssistant.globalBtn', { defaultValue: 'Global Auto-Suggest' })}
            </Button>
            <Button
              size="small"
              variant={mode === 'czech_preset' ? 'contained' : 'outlined'}
              onClick={() => setMode('czech_preset')}
              sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem', py: 0.3 }}
            >
              {t('addressAssistant.czechBtn', { defaultValue: 'Czech Regional Dropdown' })}
            </Button>
          </Stack>
        </Stack>

        {/* Global Auto-Suggest Search Input */}
        {mode === 'global' && (
          <Box sx={{ position: 'relative', mt: 1.5 }} ref={dropdownRef}>
            <TextField
              fullWidth
              size="small"
              placeholder={String(
                t('addressAssistant.placeholder', {
                  defaultValue:
                    'Type any worldwide street, campus, or landmark (e.g. Národní 1 Prague, Strahov, Oxford St)...',
                })
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              InputProps={{
                startAdornment: <LocationOnOutlined sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                endAdornment: isLoading ? <CircularProgress size={18} /> : null,
              }}
              sx={{ backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(0,0,0,0.2)' }}
            />

            {/* Dropdown Suggestions */}
            {showDropdown && suggestions.length > 0 && (
              <Paper
                elevation={6}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1400,
                  mt: 0.5,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(79, 70, 229, 0.2)',
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                <List dense disablePadding>
                  {suggestions.map((item, idx) => {
                    const p = item.properties || {};
                    const primary = [p.name, p.street, p.housenumber].filter(Boolean).join(' ');
                    const secondary = [p.city || p.town, p.state, p.country].filter(Boolean).join(', ');
                    return (
                      <ListItem key={idx} disablePadding>
                        <ListItemButton onClick={() => handleSelectSuggestion(item)}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <LocationOnOutlined color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={primary || secondary}
                            secondary={primary ? secondary : undefined}
                            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }}
                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            )}
          </Box>
        )}

        {/* Czech Republic Quick Preset Dropdown */}
        {mode === 'czech_preset' && (
          <Box sx={{ mt: 1.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="czech-region-label">
                {t('addressAssistant.selectRegion', { defaultValue: 'Select Czech Region (Kraj)' })}
              </InputLabel>
              <Select
                labelId="czech-region-label"
                label={String(
                  t('addressAssistant.selectRegion', { defaultValue: 'Select Czech Region (Kraj)' })
                )}
                value=""
                onChange={(e) => handleApplyCzechPreset(e.target.value)}
                sx={{ backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(0,0,0,0.2)' }}
              >
                {CZECH_REGIONS.map((r) => (
                  <MenuItem key={r.name} value={r.name}>
                    {r.name} (Default City: {r.city}, Zip: {r.zip})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      {/* Structured Address Form Inputs */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={String(
              t('forms.personalInfo.fields.address.street', {
                defaultValue: 'Street Address & House / Dorm Number',
              })
            )}
            name="street"
            value={value.street}
            onChange={(e) => onChange({ ...value, street: e.target.value })}
            error={!!errors.street}
            helperText={errors.street?.message}
            disabled={disabled}
            required
            size="medium"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={String(t('forms.personalInfo.fields.address.city', { defaultValue: 'City' }))}
            name="city"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            error={!!errors.city}
            helperText={errors.city?.message}
            disabled={disabled}
            required
            size="medium"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={String(
              t('forms.personalInfo.fields.address.state', {
                defaultValue: 'State / Province / Kraj',
              })
            )}
            name="state"
            value={value.state}
            onChange={(e) => onChange({ ...value, state: e.target.value })}
            error={!!errors.state}
            helperText={errors.state?.message}
            disabled={disabled}
            required
            size="medium"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={String(
              t('forms.personalInfo.fields.address.zipCode', {
                defaultValue: 'Postal / Zip Code',
              })
            )}
            name="zipCode"
            value={value.zipCode}
            onChange={(e) => onChange({ ...value, zipCode: e.target.value })}
            error={!!errors.zipCode}
            helperText={errors.zipCode?.message}
            disabled={disabled}
            required
            size="medium"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={String(t('forms.personalInfo.fields.address.country', { defaultValue: 'Country' }))}
            name="country"
            value={value.country}
            onChange={(e) => onChange({ ...value, country: e.target.value })}
            error={!!errors.country}
            helperText={errors.country?.message}
            disabled={disabled}
            required
            size="medium"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddressAutocomplete;
