import React from 'react';
import { Container, Box, Typography, Paper, Divider, Stack, Chip, useTheme } from '@mui/material';
import { GavelOutlined } from '@mui/icons-material';
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
              'Standard commercial and intermediary terms governing insurance application submission, document verification, and brokerage mediation through the FormVault digital portal.',
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
              {t('pages.terms.section1Title', { defaultValue: '1. Intermediary Scope & Broker Status' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('pages.terms.section1Content', {
                defaultValue:
                  'FormVault functions as a registered insurance intermediary and broker operating under the laws of the Czech Republic. Our platform mediates agreements between the applicant ("You") and licensed Czech/EU underwriting insurance companies (including but not limited to Pojišťovna VZP, a.s., Slavia pojišťovna a.s., Maxima pojišťovna a.s., and UNIQA pojišťovna, a.s.). Final binding coverage is executed in accordance with the underwriter\'s General Insurance Conditions (VPP).',
              })}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              {t('pages.terms.section2Title', { defaultValue: '2. Applicant Representations & Document Authenticity' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('pages.terms.section2Content', {
                defaultValue:
                  'By submitting an application and uploading identity documents (passport, student verification card, visa records), you warrant and guarantee that all submitted data is true, current, and complete. Submitting forged or altered documents is a criminal offense under Czech Penal Code (Act No. 40/2009 Coll.) and will result in immediate termination of mediation and reporting to the relevant authorities (OAMP / Czech Police).',
              })}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              {t('pages.terms.section3Title', { defaultValue: '3. Policy Issuance & Czech OAMP Compliance' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('pages.terms.section3Content', {
                defaultValue:
                  'FormVault coordinates the issuance of the official Insurance Certificate (Pojistná smlouva / Potvrzení o pojištění) compliant with the Czech Foreigners Act (Act No. 326/1999 Coll.). Once accepted and verified by the carrier, the certificate is delivered electronically to your registered email address and registered into the national insurance database.',
              })}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              {t('pages.terms.section4Title', { defaultValue: '4. Cancellations, Refunds & Visa Refusal Policy' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('pages.terms.section4Content', {
                defaultValue:
                  'In the event that your visa or long-term residence permit application is officially denied by the Czech Ministry of the Interior (OAMP) or an Embassy/Consulate, you are entitled to a refund of premium in accordance with carrier terms, subject to providing the official written rejection notice. Processing fees or administrative deductions may apply pursuant to the individual carrier\'s contract terms.',
              })}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              {t('pages.terms.section5Title', { defaultValue: '5. Governing Law & Dispute Resolution' })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {t('pages.terms.section5Content', {
                defaultValue:
                  'These terms and any agreements mediated via this platform are exclusively governed by and construed in accordance with the laws of the Czech Republic. Any disputes arising out of or in connection with our mediation services shall be subject to the exclusive jurisdiction of the competent courts of Prague, Czech Republic.',
              })}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default TermsOfServicePage;
