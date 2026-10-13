import { Container, Box, Typography, Paper, Divider, Stack, Chip, Link, useTheme } from '@mui/material';
import { GavelOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const TermsOfServicePage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Chip
          icon={<GavelOutlined sx={{ fontSize: 16 }} />}
          label={t('pages.terms.badge', {
            defaultValue:
              'Governed by Czech Civil Code (Act No. 89/2012 Coll.) & Insurance Distribution Act (Act No. 170/2018 Coll.)',
          })}
          sx={{
            mb: 2,
            px: 1.5,
            py: 0.5,
            fontSize: '0.8rem',
            fontWeight: 700,
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            color: 'primary.main',
            border: '1px solid rgba(79, 70, 229, 0.25)',
          }}
        />
        <Typography variant="h2" component="h1" sx={{ fontWeight: 800, fontSize: { xs: '2.2rem', sm: '3rem' }, mb: 2 }}>
          {t('pages.terms.title', { defaultValue: 'Terms of Service' })}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto', lineHeight: 1.6 }}>
          {t('pages.terms.subtitle', {
            defaultValue:
              'Terms governing online insurance enquiry intake and technical processing through the FormVault platform in cooperation with České pojištění a.s.',
          })}
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: '24px',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(30, 41, 59, 0.5)',
        }}
      >
        <Stack spacing={4}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              {t('pages.terms.section1Title', { defaultValue: '1. Service Scope & Role Delineation' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('pages.terms.section1Lead', {
                defaultValue:
                  'FormVault is an online insurance enquiry and technical intake portal operated by ',
              })}
              <Link
                href="https://hktse.eu.org/"
                target="_blank"
                rel="noopener noreferrer"
                color="primary"
                underline="hover"
                sx={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.3 }}
              >
                HKTSE s.r.o. <OpenInNewOutlined sx={{ fontSize: 12 }} />
              </Link>
              {' (IČO: 10858032) under a formal cooperation agreement with '}
              <Link
                href="https://ceskepojisteni.cz/"
                target="_blank"
                rel="noopener noreferrer"
                color="primary"
                underline="hover"
                sx={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.3 }}
              >
                České pojištění a.s. <OpenInNewOutlined sx={{ fontSize: 12 }} />
              </Link>
              {'. HKTSE s.r.o. acts solely as a lead introducer (tipař) collecting basic insurance requirements and contact details. HKTSE is not an insurance company or insurance intermediary.'}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              {t('pages.terms.section2Title', { defaultValue: '2. Regulated Insurance Distribution Handled by Intermediary' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('pages.terms.section2Content', {
                defaultValue:
                  'All regulated insurance advice, presentation of insurer offers, product recommendations, provision of statutory pre-contractual information, and conclusion of insurance contracts are conducted exclusively by licensed insurance intermediary České pojištění a.s. (supervised by the Czech National Bank ČNB per Act No. 170/2018 Coll.). FormVault does not issue insurance policies or recommend specific carriers.',
              })}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              {t('pages.terms.section3Title', { defaultValue: '3. Data Intake & Intermediary Handoff' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('pages.terms.section3Content', {
                defaultValue:
                  'By submitting an enquiry through FormVault, you agree that HKTSE s.r.o. may transmit your contact details and indicated insurance requirements to České pojištění a.s. so that their licensed advisors may process your enquiry and prepare available policy options. Data is protected with authenticated encryption and processed in compliance with GDPR.',
              })}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              {t('pages.terms.section4Title', { defaultValue: '4. Information Accuracy' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('pages.terms.section4Content', {
                defaultValue:
                  'You represent and warrant that the contact details and basic stay parameters provided in your enquiry are accurate and truthful to enable the intermediary to prepare relevant options suited to your situation.',
              })}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              {t('pages.terms.section5Title', { defaultValue: '5. Governing Law & Jurisdiction' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('pages.terms.section5Content', {
                defaultValue:
                  'These terms and the technical intake services provided via this platform are governed by and construed in accordance with the laws of the Czech Republic. The competent courts of Prague, Czech Republic shall have exclusive jurisdiction.',
              })}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default TermsOfServicePage;
