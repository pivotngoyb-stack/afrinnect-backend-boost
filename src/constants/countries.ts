// Shared country constants for Onboarding, EditProfile, and other pages

export const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
  'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Comoros',
  'Congo', 'DR Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea',
  'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia',
  'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius',
  'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda',
  'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone',
  'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo',
  'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe',
];

// Residence restricted to USA & Canada
export const ALLOWED_RESIDENCE_COUNTRIES = ['United States', 'Canada'];

// Heritage/origin includes African + diaspora countries
export const ALL_HERITAGE_COUNTRIES = [
  ...AFRICAN_COUNTRIES,
  'United States', 'United Kingdom', 'France', 'Canada', 'Germany', 'Brazil',
  'Jamaica', 'Haiti', 'Netherlands', 'Belgium', 'Italy', 'Spain',
  'Australia', 'Portugal', 'Trinidad and Tobago', 'Barbados', 'Other',
];
