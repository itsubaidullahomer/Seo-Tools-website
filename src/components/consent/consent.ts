/**
 * Regions where Google requires consent before analytics/ad storage is used:
 * the EU, the rest of the EEA (Iceland, Liechtenstein, Norway), the UK and Switzerland.
 */
export const CONSENT_REQUIRED_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO", "GB", "CH",
];

/**
 * Google Consent Mode v2 defaults. Must run before any Google tag: storage is denied in the
 * regions above until the Google-certified consent message (AdSense → Privacy & messaging)
 * records the visitor's choice and updates consent.
 */
export const consentDefaultsScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500,region:${JSON.stringify(CONSENT_REQUIRED_REGIONS)}});`;
