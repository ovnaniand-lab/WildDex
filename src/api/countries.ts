/**
 * Countries available for manual region selection (Phase 2).
 * Codes are ISO 3166-1 alpha-2 — exactly what GBIF `country=` and iNaturalist
 * `country_code=` geographic filters accept. Extend freely; the list is data,
 * not code.
 */

export interface CountryOption {
  code: string;
  name: string;
  continent: string;
  emoji: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'AR', name: 'Argentina', continent: 'South America', emoji: '🇦🇷' },
  { code: 'AU', name: 'Australia', continent: 'Oceania', emoji: '🇦🇺' },
  { code: 'AT', name: 'Austria', continent: 'Europe', emoji: '🇦🇹' },
  { code: 'BD', name: 'Bangladesh', continent: 'Asia', emoji: '🇧🇩' },
  { code: 'BE', name: 'Belgium', continent: 'Europe', emoji: '🇧🇪' },
  { code: 'BO', name: 'Bolivia', continent: 'South America', emoji: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', continent: 'Europe', emoji: '🇧🇦' },
  { code: 'BW', name: 'Botswana', continent: 'Africa', emoji: '🇧🇼' },
  { code: 'BR', name: 'Brazil', continent: 'South America', emoji: '🇧🇷' },
  { code: 'CA', name: 'Canada', continent: 'North America', emoji: '🇨🇦' },
  { code: 'CL', name: 'Chile', continent: 'South America', emoji: '🇨🇱' },
  { code: 'CN', name: 'China', continent: 'Asia', emoji: '🇨🇳' },
  { code: 'CO', name: 'Colombia', continent: 'South America', emoji: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', continent: 'Central America', emoji: '🇨🇷' },
  { code: 'HR', name: 'Croatia', continent: 'Europe', emoji: '🇭🇷' },
  { code: 'CZ', name: 'Czechia', continent: 'Europe', emoji: '🇨🇿' },
  { code: 'DK', name: 'Denmark', continent: 'Europe', emoji: '🇩🇰' },
  { code: 'EC', name: 'Ecuador', continent: 'South America', emoji: '🇪🇨' },
  { code: 'EG', name: 'Egypt', continent: 'Africa', emoji: '🇪🇬' },
  { code: 'EE', name: 'Estonia', continent: 'Europe', emoji: '🇪🇪' },
  { code: 'FI', name: 'Finland', continent: 'Europe', emoji: '🇫🇮' },
  { code: 'FR', name: 'France', continent: 'Europe', emoji: '🇫🇷' },
  { code: 'DE', name: 'Germany', continent: 'Europe', emoji: '🇩🇪' },
  { code: 'GH', name: 'Ghana', continent: 'Africa', emoji: '🇬🇭' },
  { code: 'GR', name: 'Greece', continent: 'Europe', emoji: '🇬🇷' },
  { code: 'GT', name: 'Guatemala', continent: 'Central America', emoji: '🇬🇹' },
  { code: 'IN', name: 'India', continent: 'Asia', emoji: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', continent: 'Asia', emoji: '🇮🇩' },
  { code: 'IE', name: 'Ireland', continent: 'Europe', emoji: '🇮🇪' },
  { code: 'IL', name: 'Israel', continent: 'Asia', emoji: '🇮🇱' },
  { code: 'IT', name: 'Italy', continent: 'Europe', emoji: '🇮🇹' },
  { code: 'JP', name: 'Japan', continent: 'Asia', emoji: '🇯🇵' },
  { code: 'KE', name: 'Kenya', continent: 'Africa', emoji: '🇰🇪' },
  { code: 'MY', name: 'Malaysia', continent: 'Asia', emoji: '🇲🇾' },
  { code: 'MX', name: 'Mexico', continent: 'North America', emoji: '🇲🇽' },
  { code: 'MA', name: 'Morocco', continent: 'Africa', emoji: '🇲🇦' },
  { code: 'NP', name: 'Nepal', continent: 'Asia', emoji: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', continent: 'Europe', emoji: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', continent: 'Oceania', emoji: '🇳🇿' },
  { code: 'NG', name: 'Nigeria', continent: 'Africa', emoji: '🇳🇬' },
  { code: 'NO', name: 'Norway', continent: 'Europe', emoji: '🇳🇴' },
  { code: 'PE', name: 'Peru', continent: 'South America', emoji: '🇵🇪' },
  { code: 'PH', name: 'Philippines', continent: 'Asia', emoji: '🇵🇭' },
  { code: 'PL', name: 'Poland', continent: 'Europe', emoji: '🇵🇱' },
  { code: 'PT', name: 'Portugal', continent: 'Europe', emoji: '🇵🇹' },
  { code: 'RO', name: 'Romania', continent: 'Europe', emoji: '🇷🇴' },
  { code: 'RU', name: 'Russia', continent: 'Europe/Asia', emoji: '🇷🇺' },
  { code: 'SA', name: 'Saudi Arabia', continent: 'Asia', emoji: '🇸🇦' },
  { code: 'RS', name: 'Serbia', continent: 'Europe', emoji: '🇷🇸' },
  { code: 'SG', name: 'Singapore', continent: 'Asia', emoji: '🇸🇬' },
  { code: 'ZA', name: 'South Africa', continent: 'Africa', emoji: '🇿🇦' },
  { code: 'KR', name: 'South Korea', continent: 'Asia', emoji: '🇰🇷' },
  { code: 'ES', name: 'Spain', continent: 'Europe', emoji: '🇪🇸' },
  { code: 'SE', name: 'Sweden', continent: 'Europe', emoji: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', continent: 'Europe', emoji: '🇨🇭' },
  { code: 'TZ', name: 'Tanzania', continent: 'Africa', emoji: '🇹🇿' },
  { code: 'TH', name: 'Thailand', continent: 'Asia', emoji: '🇹🇭' },
  { code: 'TR', name: 'Türkiye', continent: 'Europe/Asia', emoji: '🇹🇷' },
  { code: 'UG', name: 'Uganda', continent: 'Africa', emoji: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', continent: 'Europe', emoji: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates', continent: 'Asia', emoji: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', continent: 'Europe', emoji: '🇬🇧' },
  { code: 'US', name: 'United States', continent: 'North America', emoji: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', continent: 'South America', emoji: '🇺🇾' },
  { code: 'VN', name: 'Vietnam', continent: 'Asia', emoji: '🇻🇳' },
  { code: 'ZW', name: 'Zimbabwe', continent: 'Africa', emoji: '🇿🇼' },
];

export function countryByCode(code: string | undefined): CountryOption | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
