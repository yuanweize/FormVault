import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Box,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  LocationOnOutlined,
  PublicOutlined,
  TuneOutlined,
} from '@mui/icons-material';
import { Controller, Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PersonalInfo, Address } from '../../../types';

interface AddressFieldProps {
  control: Control<PersonalInfo>;
  errors?: FieldErrors<Address>;
  disabled?: boolean;
  setValue?: UseFormSetValue<PersonalInfo>;
}

// Official Czech administrative regions (Kraje) + standard capitals for fast selection
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

const AddressField: React.FC<AddressFieldProps> = ({
  control,
  errors,
  disabled = false,
  setValue,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Assistant state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [assistantMode, setAssistantMode] = useState<'global' | 'czech'>('global');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global search via OpenStreetMap Photon API (Worldwide coverage, multi-language, free & fast)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3 || assistantMode !== 'global') {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.features) {
            setSuggestions(data.features);
            setShowDropdown(true);
          }
        }
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [searchQuery, assistantMode]);

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

  const handleSelectSuggestion = (feature: any) => {
    const props = feature.properties || {};
    let streetName = props.street || props.name || '';
    if (props.housenumber) {
      streetName = `${streetName} ${props.housenumber}`.trim();
    }
    const city = props.city || props.town || props.district || props.county || '';
    const state = props.state || props.county || '';
    const zipCode = props.postcode || '';
    const countryCode = props.countrycode?.toUpperCase() || 'CZ';

    if (setValue) {
      if (streetName) setValue('address.street', streetName, { shouldValidate: true });
      if (city) setValue('address.city', city, { shouldValidate: true });
      if (state) setValue('address.state', state, { shouldValidate: true });
      if (zipCode) setValue('address.zipCode', zipCode, { shouldValidate: true });
      setValue('address.country', countryCode, { shouldValidate: true });
    }

    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleApplyCzechPreset = (regionName: string) => {
    const found = CZECH_REGIONS.find((r) => r.name === regionName);
    if (found && setValue) {
      setValue('address.state', found.name.split(' (')[0], { shouldValidate: true });
      setValue('address.city', found.city, { shouldValidate: true });
      setValue('address.zipCode', found.zip, { shouldValidate: true });
      setValue('address.country', 'CZ', { shouldValidate: true });
    }
  };

  const countries = [
    { value: 'CZ', label: 'Czech Republic (Česká republika)' },
    { value: 'CN', label: t('forms.personalInfo.countries.CN', { defaultValue: 'China' }) },
    { value: 'US', label: t('forms.personalInfo.countries.US', { defaultValue: 'United States' }) },
    { value: 'DE', label: t('forms.personalInfo.countries.DE', { defaultValue: 'Germany' }) },
    { value: 'SK', label: 'Slovakia (Slovensko)' },
    { value: 'UA', label: 'Ukraine (Україна)' },
    { value: 'VN', label: 'Vietnam (Việt Nam)' },
    { value: 'RU', label: 'Russia (Россия)' },
    { value: 'GB', label: t('forms.personalInfo.countries.GB', { defaultValue: 'United Kingdom' }) },
    { value: 'FR', label: t('forms.personalInfo.countries.FR', { defaultValue: 'France' }) },
    { value: 'ES', label: t('forms.personalInfo.countries.ES', { defaultValue: 'Spain' }) },
    { value: 'CA', label: t('forms.personalInfo.countries.CA', { defaultValue: 'Canada' }) },
    { value: 'MX', label: t('forms.personalInfo.countries.MX', { defaultValue: 'Mexico' }) },
    { value: 'AU', label: t('forms.personalInfo.countries.AU', { defaultValue: 'Australia' }) },
    { value: 'JP', label: t('forms.personalInfo.countries.JP', { defaultValue: 'Japan' }) },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Smart Address Assistant Toolbar (Global & Czechia) */}
      <Box
        sx={{
          mb: 2.5,
          p: 2,
          borderRadius: '14px',
          backgroundColor:
            theme.palette.mode === 'light' ? 'rgba(79, 70, 229, 0.04)' : 'rgba(79, 70, 229, 0.12)',
          border: '1px solid rgba(79, 70, 229, 0.2)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1}
          sx={{ mb: 1.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PublicOutlined sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle2" component="span" sx={{ fontWeight: 700 }}>
              Smart Address Autofill (Worldwide & Czechia)
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={assistantMode === 'global' ? 'contained' : 'outlined'}
              onClick={() => setAssistantMode('global')}
              sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem', py: 0.3 }}
            >
              Worldwide Search
            </Button>
            <Button
              size="small"
              variant={assistantMode === 'czech' ? 'contained' : 'outlined'}
              onClick={() => setAssistantMode('czech')}
              sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem', py: 0.3 }}
            >
              Czech Regional Dropdown
            </Button>
          </Stack>
        </Stack>

        {/* Global Auto-Suggest Input */}
        {assistantMode === 'global' && (
          <Box sx={{ position: 'relative' }} ref={dropdownRef}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search any address worldwide (e.g. Národní 1 Prague, Kolej Strahov, Oxford St London, 中关村)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              InputProps={{
                startAdornment: <LocationOnOutlined sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
                endAdornment: isLoading ? <CircularProgress size={16} /> : null,
              }}
              sx={{
                backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(15, 23, 42, 0.6)',
              }}
            />

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
                  border: '1px solid rgba(79, 70, 229, 0.25)',
                  maxHeight: 260,
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
                          <ListItemIcon sx={{ minWidth: 30 }}>
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

        {/* Czech Region Quick Select Dropdown */}
        {assistantMode === 'czech' && (
          <FormControl fullWidth size="small">
            <InputLabel id="quick-czech-region-label">Select Czech Region (Kraj)</InputLabel>
            <Select
              labelId="quick-czech-region-label"
              label="Select Czech Region (Kraj)"
              value=""
              onChange={(e) => handleApplyCzechPreset(e.target.value)}
              sx={{ backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(15, 23, 42, 0.6)' }}
            >
              {CZECH_REGIONS.map((r) => (
                <MenuItem key={r.name} value={r.name}>
                  {r.name} (Default City: {r.city}, Zip: {r.zip})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Standard Form Inputs (Controller controlled & Accessible) */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="address.street"
            control={control}
            rules={{
              required: t('forms.personalInfo.validation.address.street.required') as string,
              minLength: {
                value: 5,
                message: t('forms.personalInfo.validation.address.street.minLength') as string,
              },
              maxLength: {
                value: 100,
                message: t('forms.personalInfo.validation.address.street.maxLength') as string,
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="medium"
                label={t('forms.personalInfo.fields.address.street')}
                error={!!errors?.street}
                helperText={errors?.street?.message}
                disabled={disabled}
                inputProps={{
                  'data-testid': 'street-address-input',
                  'aria-label': t('forms.personalInfo.fields.address.street') as string,
                  'aria-describedby': errors?.street ? 'street-error' : undefined,
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="address.city"
            control={control}
            rules={{
              required: t('forms.personalInfo.validation.address.city.required') as string,
              minLength: {
                value: 2,
                message: t('forms.personalInfo.validation.address.city.minLength') as string,
              },
              maxLength: {
                value: 50,
                message: t('forms.personalInfo.validation.address.city.maxLength') as string,
              },
              pattern: {
                value: /^[\p{L}\s\-']+$/u,
                message: t('forms.personalInfo.validation.address.city.pattern') as string,
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="medium"
                label={t('forms.personalInfo.fields.address.city')}
                error={!!errors?.city}
                helperText={errors?.city?.message}
                disabled={disabled}
                inputProps={{
                  'data-testid': 'city-input',
                  'aria-label': t('forms.personalInfo.fields.address.city') as string,
                  'aria-describedby': errors?.city ? 'city-error' : undefined,
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="address.state"
            control={control}
            rules={{
              required: t('forms.personalInfo.validation.address.state.required') as string,
              minLength: {
                value: 2,
                message: t('forms.personalInfo.validation.address.state.minLength') as string,
              },
              maxLength: {
                value: 50,
                message: t('forms.personalInfo.validation.address.state.maxLength') as string,
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="medium"
                label={t('forms.personalInfo.fields.address.state')}
                error={!!errors?.state}
                helperText={errors?.state?.message}
                disabled={disabled}
                inputProps={{
                  'data-testid': 'state-input',
                  'aria-label': t('forms.personalInfo.fields.address.state') as string,
                  'aria-describedby': errors?.state ? 'state-error' : undefined,
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="address.zipCode"
            control={control}
            rules={{
              required: t('forms.personalInfo.validation.address.zipCode.required') as string,
              pattern: {
                value: /^[A-Za-z0-9\s\-]{3,10}$/,
                message: t('forms.personalInfo.validation.address.zipCode.pattern') as string,
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                size="medium"
                label={t('forms.personalInfo.fields.address.zipCode')}
                error={!!errors?.zipCode}
                helperText={errors?.zipCode?.message}
                disabled={disabled}
                inputProps={{
                  'data-testid': 'zip-code-input',
                  'aria-label': t('forms.personalInfo.fields.address.zipCode') as string,
                  'aria-describedby': errors?.zipCode ? 'zipCode-error' : undefined,
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors?.country} disabled={disabled} size="medium">
            <InputLabel id="country-label">
              {t('forms.personalInfo.fields.address.country')}
            </InputLabel>
            <Controller
              name="address.country"
              control={control}
              rules={{
                required: t('forms.personalInfo.validation.address.country.required') as string,
              }}
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="country-label"
                  label={t('forms.personalInfo.fields.address.country')}
                  data-testid="country-select"
                  inputProps={{
                    'aria-label': t('forms.personalInfo.fields.address.country') as string,
                    'aria-describedby': errors?.country ? 'country-error' : undefined,
                  }}
                >
                  {countries.map((country) => (
                    <MenuItem key={country.value} value={country.value}>
                      {country.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors?.country && (
              <FormHelperText id="country-error">
                {errors.country.message}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export { AddressField };
export default AddressField;