import { ModelParameters } from './stockAndFlowModel';

export interface CountryProfile {
  country: string;
  countryCode: string;
  region: string;
  diseaseProfile: string;
  urbanPopulationPct: number;
  ruralPopulationPct: number;
  gdpPerCapitaUSD: number;
  healthExpenditurePerCapitaUSD: number;
  physicianDensityPer1000: number;
  hospitalBedsPer1000: number;
  description: string;
}

export interface DiseaseBurdenMultiplier {
  country: string;
  disease: string;
  incidenceMultiplier: number;
  mortalityMultiplier: number;
  careSeekingMultiplier: number;
  notes: string;
}

export interface DiseaseSeverity {
  disease: string;
  severityCategory: 'Low' | 'Low-Moderate' | 'Moderate' | 'Moderate-High' | 'High' | 'Very High';
  acuityLevel: 'Acute' | 'Chronic' | 'Acute/Chronic';
  selfCareAmenable: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  aiTriageImpact: 'Low' | 'Moderate' | 'High' | 'Very High';
  aiSelfCareImpact: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  clinicalCharacteristics: string;
}

export interface CountrySpecificParameters extends ModelParameters {
  countryProfile: CountryProfile;
  isUrban: boolean;
  diseaseSeverity: DiseaseSeverity;
  // Additional country-specific adjustments
  infrastructureMultiplier: number; // Based on country's health infrastructure
  healthWorkforceDensityMultiplier: number; // Based on physician/nurse density
}

// Country profiles based on real data
export const countryProfiles: Record<string, CountryProfile> = {
  nigeria: {
    country: 'Nigeria',
    countryCode: 'NGA',
    region: 'West Africa',
    diseaseProfile: 'High Pneumonia/Diarrhea',
    urbanPopulationPct: 0.52,
    ruralPopulationPct: 0.48,
    gdpPerCapitaUSD: 2097,
    healthExpenditurePerCapitaUSD: 71,
    physicianDensityPer1000: 0.4,
    hospitalBedsPer1000: 0.5,
    description: 'Nigeria faces high burden from childhood infectious diseases. Leading causes of under-5 mortality are pneumonia (19%), diarrhea (11%), and malaria (11%). Weak primary care infrastructure, especially in rural areas.'
  },
  kenya: {
    country: 'Kenya',
    countryCode: 'KEN',
    region: 'East Africa',
    diseaseProfile: 'High HIV/TB',
    urbanPopulationPct: 0.28,
    ruralPopulationPct: 0.72,
    gdpPerCapitaUSD: 1879,
    healthExpenditurePerCapitaUSD: 88,
    physicianDensityPer1000: 0.2,
    hospitalBedsPer1000: 1.4,
    description: 'Kenya has significant HIV burden (4.9% prevalence) with high TB co-infection rates. Strong vertical disease programs but fragmented primary care. Better health infrastructure than regional average.'
  },
  south_africa: {
    country: 'South Africa',
    countryCode: 'ZAF',
    region: 'Southern Africa',
    diseaseProfile: 'Very High HIV/TB',
    urbanPopulationPct: 0.67,
    ruralPopulationPct: 0.33,
    gdpPerCapitaUSD: 6994,
    healthExpenditurePerCapitaUSD: 499,
    physicianDensityPer1000: 0.9,
    hospitalBedsPer1000: 2.3,
    description: 'South Africa has the world\'s largest HIV epidemic (20.4% prevalence) with extremely high TB burden including extensive drug resistance. Strong public health system but faces significant inequality and resource constraints. Best health infrastructure in the region but overwhelmed by disease burden.'
  },
  rwanda: {
    country: 'Rwanda',
    countryCode: 'RWA',
    region: 'East Africa',
    diseaseProfile: 'High Utilization LMIC',
    urbanPopulationPct: 0.17,
    ruralPopulationPct: 0.83,
    gdpPerCapitaUSD: 833,
    healthExpenditurePerCapitaUSD: 84,
    physicianDensityPer1000: 0.1,
    hospitalBedsPer1000: 1.6,
    description: 'Rwanda achieved near-universal health coverage (>90% enrolled in Mutuelle de Santé). Strong CHW network (45,000+ cooperatives) provides primary contact. High system utilization but faces efficiency challenges: long wait times, overcrowded facilities. AI can optimize flow rather than improve access.'
  },
  test_country: {
    country: 'TEST Perfect System',
    countryCode: 'TEST',
    region: 'Test Region',
    diseaseProfile: 'Perfect Care',
    urbanPopulationPct: 1.0,
    ruralPopulationPct: 0.0,
    gdpPerCapitaUSD: 50000,
    healthExpenditurePerCapitaUSD: 5000,
    physicianDensityPer1000: 5.0,
    hospitalBedsPer1000: 10.0,
    description: 'TEST SETTING: A perfect health system where 100% of patients seek formal care immediately. Self-care AI should have ZERO impact because no one uses informal care. Use this to verify calculations are correct.'
  }
};

// Disease burden multipliers by country
export const countryDiseaseBurdens: Record<string, Record<string, DiseaseBurdenMultiplier>> = {
  nigeria: {
    tuberculosis: { country: 'Nigeria', disease: 'tuberculosis', incidenceMultiplier: 0.8, mortalityMultiplier: 0.9, careSeekingMultiplier: 0.7, notes: 'Lower TB burden than Kenya but poor case detection' },
    malaria: { country: 'Nigeria', disease: 'malaria', incidenceMultiplier: 1.5, mortalityMultiplier: 1.3, careSeekingMultiplier: 0.8, notes: 'High malaria endemicity, especially in rural areas' },
    childhood_pneumonia: { country: 'Nigeria', disease: 'childhood_pneumonia', incidenceMultiplier: 1.8, mortalityMultiplier: 1.6, careSeekingMultiplier: 0.6, notes: 'Very high childhood pneumonia burden' },
    diarrhea: { country: 'Nigeria', disease: 'diarrhea', incidenceMultiplier: 1.7, mortalityMultiplier: 1.5, careSeekingMultiplier: 0.65, notes: 'Major cause of under-5 mortality' },
    hiv_management_chronic: { country: 'Nigeria', disease: 'hiv_management_chronic', incidenceMultiplier: 0.6, mortalityMultiplier: 0.8, careSeekingMultiplier: 0.8, notes: 'Lower HIV prevalence than East/Southern Africa' },
    hiv_opportunistic: { country: 'Nigeria', disease: 'hiv_opportunistic', incidenceMultiplier: 0.6, mortalityMultiplier: 0.9, careSeekingMultiplier: 0.7, notes: 'Lower HIV burden but weaker health system' },
    fever: { country: 'Nigeria', disease: 'fever', incidenceMultiplier: 1.4, mortalityMultiplier: 1.3, careSeekingMultiplier: 0.6, notes: 'High burden of febrile illnesses' },
    urti: { country: 'Nigeria', disease: 'urti', incidenceMultiplier: 1.3, mortalityMultiplier: 1.1, careSeekingMultiplier: 0.7, notes: 'Common but often self-treated' },
    congestive_heart_failure: { country: 'Nigeria', disease: 'congestive_heart_failure', incidenceMultiplier: 1.2, mortalityMultiplier: 1.3, careSeekingMultiplier: 0.6, notes: 'Growing NCD burden, limited cardiac care' },
    hypertension: { country: 'Nigeria', disease: 'hypertension', incidenceMultiplier: 1.4, mortalityMultiplier: 1.5, careSeekingMultiplier: 0.5, notes: 'Very high prevalence (38%), low awareness and treatment rates' }
  },
  kenya: {
    tuberculosis: { country: 'Kenya', disease: 'tuberculosis', incidenceMultiplier: 1.5, mortalityMultiplier: 1.4, careSeekingMultiplier: 0.85, notes: 'High TB burden, strong TB program' },
    malaria: { country: 'Kenya', disease: 'malaria', incidenceMultiplier: 1.1, mortalityMultiplier: 1.0, careSeekingMultiplier: 0.9, notes: 'Endemic in western regions' },
    childhood_pneumonia: { country: 'Kenya', disease: 'childhood_pneumonia', incidenceMultiplier: 1.2, mortalityMultiplier: 1.1, careSeekingMultiplier: 0.8, notes: 'Significant but declining' },
    diarrhea: { country: 'Kenya', disease: 'diarrhea', incidenceMultiplier: 1.1, mortalityMultiplier: 1.0, careSeekingMultiplier: 0.8, notes: 'Improved water/sanitation reducing burden' },
    hiv_management_chronic: { country: 'Kenya', disease: 'hiv_management_chronic', incidenceMultiplier: 1.8, mortalityMultiplier: 1.5, careSeekingMultiplier: 0.9, notes: 'High HIV prevalence, good treatment programs' },
    hiv_opportunistic: { country: 'Kenya', disease: 'hiv_opportunistic', incidenceMultiplier: 2.0, mortalityMultiplier: 1.6, careSeekingMultiplier: 0.85, notes: 'High HIV-TB co-infection' },
    fever: { country: 'Kenya', disease: 'fever', incidenceMultiplier: 1.2, mortalityMultiplier: 1.1, careSeekingMultiplier: 0.8, notes: 'Better health seeking behavior' },
    urti: { country: 'Kenya', disease: 'urti', incidenceMultiplier: 1.1, mortalityMultiplier: 1.0, careSeekingMultiplier: 0.85, notes: 'Good primary care access' },
    congestive_heart_failure: { country: 'Kenya', disease: 'congestive_heart_failure', incidenceMultiplier: 1.3, mortalityMultiplier: 1.2, careSeekingMultiplier: 0.7, notes: 'Limited cardiac services' },
    hypertension: { country: 'Kenya', disease: 'hypertension', incidenceMultiplier: 1.3, mortalityMultiplier: 1.3, careSeekingMultiplier: 0.6, notes: 'High prevalence (24%), improving but still low treatment coverage' }
  },
  south_africa: {
    tuberculosis: { country: 'South Africa', disease: 'tuberculosis', incidenceMultiplier: 2.2, mortalityMultiplier: 1.8, careSeekingMultiplier: 0.9, notes: 'Highest TB burden globally (400+ per 100k), extensive drug resistance, strong detection but high mortality' },
    hiv_management_chronic: { country: 'South Africa', disease: 'hiv_management_chronic', incidenceMultiplier: 2.5, mortalityMultiplier: 1.6, careSeekingMultiplier: 0.95, notes: 'World\'s largest HIV epidemic (20.4% prevalence), excellent ART program coverage' },
    hiv_opportunistic: { country: 'South Africa', disease: 'hiv_opportunistic', incidenceMultiplier: 3.0, mortalityMultiplier: 2.0, careSeekingMultiplier: 0.9, notes: 'Very high opportunistic infection burden due to massive HIV epidemic' },
    childhood_pneumonia: { country: 'South Africa', disease: 'childhood_pneumonia', incidenceMultiplier: 1.3, mortalityMultiplier: 1.2, careSeekingMultiplier: 0.85, notes: 'Moderate burden, better than other African countries due to stronger health system' },
    diarrhea: { country: 'South Africa', disease: 'diarrhea', incidenceMultiplier: 1.0, mortalityMultiplier: 0.9, careSeekingMultiplier: 0.9, notes: 'Lower burden due to better water/sanitation in urban areas' },
    malaria: { country: 'South Africa', disease: 'malaria', incidenceMultiplier: 0.3, mortalityMultiplier: 0.8, careSeekingMultiplier: 0.95, notes: 'Low malaria burden, mainly in northern provinces (Limpopo, Mpumalanga, KwaZulu-Natal)' },
    congestive_heart_failure: { country: 'South Africa', disease: 'congestive_heart_failure', incidenceMultiplier: 1.8, mortalityMultiplier: 1.4, careSeekingMultiplier: 0.8, notes: 'High NCDs burden due to epidemiological transition and urbanization' },
    urti: { country: 'South Africa', disease: 'urti', incidenceMultiplier: 1.1, mortalityMultiplier: 1.0, careSeekingMultiplier: 0.9, notes: 'Moderate burden, good healthcare access in urban areas' },
    fever: { country: 'South Africa', disease: 'fever', incidenceMultiplier: 1.2, mortalityMultiplier: 1.1, careSeekingMultiplier: 0.85, notes: 'Higher complexity due to HIV/TB co-infections requiring careful evaluation' },
    hypertension: { country: 'South Africa', disease: 'hypertension', incidenceMultiplier: 1.5, mortalityMultiplier: 1.4, careSeekingMultiplier: 0.7, notes: 'Very high prevalence (46%), better care access but still suboptimal control' }
  },
  rwanda: {
    tuberculosis: { country: 'Rwanda', disease: 'tuberculosis', incidenceMultiplier: 0.7, mortalityMultiplier: 0.8, careSeekingMultiplier: 0.95, notes: 'Good TB program with high case detection rate due to CHW network' },
    malaria: { country: 'Rwanda', disease: 'malaria', incidenceMultiplier: 0.8, mortalityMultiplier: 0.7, careSeekingMultiplier: 0.9, notes: 'Successful malaria control program, cases declining' },
    childhood_pneumonia: { country: 'Rwanda', disease: 'childhood_pneumonia', incidenceMultiplier: 1.2, mortalityMultiplier: 0.9, careSeekingMultiplier: 0.85, notes: 'Common but CHWs trained in early detection' },
    diarrhea: { country: 'Rwanda', disease: 'diarrhea', incidenceMultiplier: 1.0, mortalityMultiplier: 0.8, careSeekingMultiplier: 0.85, notes: 'Improved water/sanitation reducing burden' },
    hiv_management_chronic: { country: 'Rwanda', disease: 'hiv_management_chronic', incidenceMultiplier: 0.5, mortalityMultiplier: 0.6, careSeekingMultiplier: 0.95, notes: 'Excellent HIV program, near elimination of mother-to-child transmission' },
    hiv_opportunistic: { country: 'Rwanda', disease: 'hiv_opportunistic', incidenceMultiplier: 0.5, mortalityMultiplier: 0.7, careSeekingMultiplier: 0.9, notes: 'Strong HIV care cascade reduces opportunistic infections' },
    fever: { country: 'Rwanda', disease: 'fever', incidenceMultiplier: 1.1, mortalityMultiplier: 0.9, careSeekingMultiplier: 0.9, notes: 'High health facility use for febrile illness' },
    urti: { country: 'Rwanda', disease: 'urti', incidenceMultiplier: 1.0, mortalityMultiplier: 0.8, careSeekingMultiplier: 0.85, notes: 'Common but CHWs manage most cases' },
    congestive_heart_failure: { country: 'Rwanda', disease: 'congestive_heart_failure', incidenceMultiplier: 0.9, mortalityMultiplier: 1.3, careSeekingMultiplier: 0.8, notes: 'Growing NCD burden but limited specialized care' },
    hypertension: { country: 'Rwanda', disease: 'hypertension', incidenceMultiplier: 1.1, mortalityMultiplier: 1.2, careSeekingMultiplier: 0.85, notes: 'Moderate prevalence (15%), good CHW network for BP screening' }
  },
  test_country: {
    // All diseases have perfect care seeking (1.0) and normal burden
    tuberculosis: { country: 'test_country', disease: 'tuberculosis', incidenceMultiplier: 1.0, mortalityMultiplier: 1.0, careSeekingMultiplier: 1.0, notes: 'Perfect care seeking' },
    malaria: { country: 'test_country', disease: 'malaria', incidenceMultiplier: 1.0, mortalityMultiplier: 1.0, careSeekingMultiplier: 1.0, notes: 'Perfect care seeking' },
    childhood_pneumonia: { country: 'test_country', disease: 'childhood_pneumonia', incidenceMultiplier: 1.0, mortalityMultiplier: 1.0, careSeekingMultiplier: 1.0, notes: 'Perfect care seeking' },
    diarrhea: { country: 'test_country', disease: 'diarrhea', incidenceMultiplier: 1.0, mortalityMultiplier: 1.0, careSeekingMultiplier: 1.0, notes: 'Perfect care seeking' },
    hiv_management_chronic: { country: 'test_country', disease: 'hiv_management_chronic', incidenceMultiplier: 1.0, mortalityMultiplier: 1.0, careSeekingMultiplier: 1.0, notes: 'Perfect care seeking' },
    hiv_opportunistic: { country: 'test_country', disease: 'hiv_opportunistic', incidenceMultiplier: 1.0, mortalityMultiplier: 1.0, careSeekingMultiplier: 1.0, notes: 'Perfect care seeking' },
    fever: { country: 'test_country', disease: 'fever', incidenceMultiplier: 1.0, mortalityMultiplier: 1.0, careSeekingMultiplier: 1.0, notes: 'Perfect care seeking' },
    urti: { country: 'test_country', disease: 'urti', incidenceMultiplier: 1.0, mortalityMultiplier: 1.0, careSeekingMultiplier: 1.0, notes: 'Perfect care seeking' },
    congestive_heart_failure: { country: 'test_country', disease: 'congestive_heart_failure', incidenceMultiplier: 1.0, mortalityMultiplier: 1.0, careSeekingMultiplier: 1.0, notes: 'Perfect care seeking' },
    hypertension: { country: 'test_country', disease: 'hypertension', incidenceMultiplier: 1.0, mortalityMultiplier: 1.0, careSeekingMultiplier: 1.0, notes: 'Perfect care seeking' }
  }
};

// Disease severity classifications
export const diseaseSeverityData: Record<string, DiseaseSeverity> = {
  fever: {
    disease: 'fever',
    severityCategory: 'Low',
    acuityLevel: 'Acute',
    selfCareAmenable: 'Very High',
    aiTriageImpact: 'High',
    aiSelfCareImpact: 'Very High',
    clinicalCharacteristics: 'Self-limiting viral infections, mild bacterial infections. Most resolve with supportive care.'
  },
  urti: {
    disease: 'urti',
    severityCategory: 'Low',
    acuityLevel: 'Acute',
    selfCareAmenable: 'Very High',
    aiTriageImpact: 'High',
    aiSelfCareImpact: 'Very High',
    clinicalCharacteristics: 'Common cold, mild respiratory infections. Symptomatic management effective.'
  },
  diarrhea: {
    disease: 'diarrhea',
    severityCategory: 'Low-Moderate',
    acuityLevel: 'Acute',
    selfCareAmenable: 'High',
    aiTriageImpact: 'High',
    aiSelfCareImpact: 'High',
    clinicalCharacteristics: 'Varies from mild self-limiting to severe dehydration. Early ORS critical.'
  },
  pneumonia_childhood: {
    disease: 'pneumonia_childhood',
    severityCategory: 'Moderate-High',
    acuityLevel: 'Acute',
    selfCareAmenable: 'Low',
    aiTriageImpact: 'Very High',
    aiSelfCareImpact: 'Moderate',
    clinicalCharacteristics: 'Can deteriorate rapidly. Early recognition critical but treatment needs antibiotics.'
  },
  malaria: {
    disease: 'malaria',
    severityCategory: 'Moderate-High',
    acuityLevel: 'Acute',
    selfCareAmenable: 'Low',
    aiTriageImpact: 'High',
    aiSelfCareImpact: 'Moderate',
    clinicalCharacteristics: 'Requires rapid diagnosis and treatment. Self-care limited to prevention.'
  },
  tb: {
    disease: 'tb',
    severityCategory: 'High',
    acuityLevel: 'Chronic',
    selfCareAmenable: 'Very Low',
    aiTriageImpact: 'Moderate',
    aiSelfCareImpact: 'Very Low',
    clinicalCharacteristics: 'Complex diagnosis, long treatment course, requires monitoring.'
  },
  hiv_management: {
    disease: 'hiv_management',
    severityCategory: 'High',
    acuityLevel: 'Chronic',
    selfCareAmenable: 'Very Low',
    aiTriageImpact: 'Low',
    aiSelfCareImpact: 'Low',
    clinicalCharacteristics: 'Lifelong ART required, regular monitoring essential.'
  },
  congestive_heart_failure: {
    disease: 'congestive_heart_failure',
    severityCategory: 'Very High',
    acuityLevel: 'Chronic',
    selfCareAmenable: 'Very Low',
    aiTriageImpact: 'High',
    aiSelfCareImpact: 'Very Low',
    clinicalCharacteristics: 'Complex cardiac condition requiring specialized care, regular monitoring, and medication management. Self-care limited to symptom monitoring and medication adherence.'
  },
  hypertension: {
    disease: 'hypertension',
    severityCategory: 'Moderate',
    acuityLevel: 'Chronic',
    selfCareAmenable: 'Very High',
    aiTriageImpact: 'High',
    aiSelfCareImpact: 'Very High',
    clinicalCharacteristics: 'Chronic condition requiring regular monitoring and medication. Self-care AI enables home BP monitoring, medication reminders, lifestyle coaching, and early detection of complications.'
  }
};

// Function to adjust parameters based on country and setting
export function adjustParametersForCountry(
  baseParams: ModelParameters,
  countryCode: string,
  isUrban: boolean,
  disease: string
): CountrySpecificParameters {
  console.log(`Adjusting parameters for country: ${countryCode}, urban: ${isUrban}, disease: ${disease}`);
  console.log(`Base params lambda: ${baseParams.lambda}, mu0: ${baseParams.mu0}, deltaU: ${baseParams.deltaU}`);
  console.log(`Base params phi0: ${baseParams.phi0}`);
  
  const country = countryProfiles[countryCode];
  if (!country) {
    throw new Error(`Country profile not found for ${countryCode}`);
  }

  const burdenMultipliers = countryDiseaseBurdens[countryCode]?.[disease];
  const severity = diseaseSeverityData[disease];
  
  console.log(`Burden multipliers for ${countryCode}/${disease}:`, burdenMultipliers);

  // Calculate infrastructure multiplier based on country metrics
  const infrastructureMultiplier = calculateInfrastructureMultiplier(country);
  const workforceMultiplier = calculateWorkforceMultiplier(country);

  // Adjust base parameters
  let adjustedParams = { ...baseParams } as CountrySpecificParameters;

  // Apply country-specific disease burden
  if (burdenMultipliers) {
    console.log(`Applying burden multipliers - lambda before: ${adjustedParams.lambda}, incidenceMultiplier: ${burdenMultipliers.incidenceMultiplier}`);
    adjustedParams.lambda *= burdenMultipliers.incidenceMultiplier;
    adjustedParams.deltaU *= burdenMultipliers.mortalityMultiplier;
    adjustedParams.deltaI *= burdenMultipliers.mortalityMultiplier;
    adjustedParams.delta0 *= burdenMultipliers.mortalityMultiplier;
    adjustedParams.delta1 *= burdenMultipliers.mortalityMultiplier;
    adjustedParams.delta2 *= burdenMultipliers.mortalityMultiplier;
    adjustedParams.delta3 *= burdenMultipliers.mortalityMultiplier;
    // DISABLED: Burden careseeking multiplier
    // adjustedParams.phi0 *= burdenMultipliers.careSeekingMultiplier;
    console.log(`After burden multipliers - lambda: ${adjustedParams.lambda}, deltaU: ${adjustedParams.deltaU}`);
    console.log(`After burden multipliers - phi0: ${adjustedParams.phi0} (base: ${baseParams.phi0}, multiplier: ${burdenMultipliers.careSeekingMultiplier})`);
  } else {
    console.log(`WARNING: No burden multipliers found for ${countryCode}/${disease}`);
  }

  // Rwanda-specific adjustments for very high formal care utilization
  if (countryCode === 'rwanda') {
    // In Rwanda, almost everyone goes directly to CHWs or health centers
    adjustedParams.phi0 = 0.92; // 92% go directly to formal care
    adjustedParams.sigmaI = 0.65; // Those who try informal quickly transition
    
    // CRITICAL: informalCareRatio is the proportion who stay UNTREATED, not informal
    // High value = more stay untreated (don't go to informal care)
    // Low value = more go to informal care
    // For Rwanda with minimal informal sector, we want HIGH informalCareRatio
    adjustedParams.informalCareRatio = 0.10; // 10% of non-formal seekers stay untreated, 90% use informal
  }
  
  // TEST country - perfect formal care system
  if (countryCode === 'test_country') {
    // EVERYONE seeks formal care immediately
    adjustedParams.phi0 = 1.0; // 100% go directly to formal care
    adjustedParams.sigmaI = 1.0; // Instant transition (not needed with phi0=1)
    adjustedParams.informalCareRatio = 0.0; // 0% stay untreated - everyone gets care!
    
    // Perfect system - no congestion, perfect efficiency
    adjustedParams.systemCongestion = 0.0;
    
    // Override all multipliers to perfect values
    adjustedParams.mu0 = baseParams.mu0; // Use base values without reduction
    adjustedParams.mu1 = baseParams.mu1;
    adjustedParams.mu2 = baseParams.mu2;
    adjustedParams.mu3 = baseParams.mu3;
    
    // Note: self-care AI should have ZERO impact in this system
  }
  
  // Apply country-specific urban/rural adjustments
  if (!isUrban) {
    console.log(`  Applying rural adjustments for ${disease} in ${countryCode}`);
    
    // Country-specific rural multipliers based on health system infrastructure
    const ruralMultipliers = getRuralMultipliers(countryCode, disease);
    
    // Care-seeking adjustments
    adjustedParams.phi0 *= ruralMultipliers.phi0;
    adjustedParams.sigmaI *= ruralMultipliers.sigmaI;
    adjustedParams.informalCareRatio *= ruralMultipliers.informalRatio;
    
    // Resolution rate adjustments with caps to prevent extreme values
    adjustedParams.mu0 *= Math.max(0.5, ruralMultipliers.mu0);
    adjustedParams.mu1 *= Math.max(0.4, ruralMultipliers.mu1);
    adjustedParams.mu2 *= Math.max(0.5, ruralMultipliers.mu2);
    adjustedParams.mu3 *= Math.max(0.6, ruralMultipliers.mu3);
    
    // Mortality adjustments with tighter caps to prevent extreme compound effects
    const oldDeltaU = adjustedParams.deltaU;
    adjustedParams.deltaU *= Math.min(1.5, ruralMultipliers.deltaU);
    adjustedParams.deltaI *= Math.min(1.5, ruralMultipliers.deltaI);
    adjustedParams.delta0 *= Math.min(1.4, ruralMultipliers.delta0);
    adjustedParams.delta1 *= Math.min(1.4, ruralMultipliers.delta1);
    adjustedParams.delta2 *= Math.min(1.3, ruralMultipliers.delta2);
    adjustedParams.delta3 *= Math.min(1.2, ruralMultipliers.delta3);
    console.log(`  Rural mortality adjustment: deltaU ${oldDeltaU} -> ${adjustedParams.deltaU}`);
    
    // Referral rate adjustments
    adjustedParams.rho0 *= Math.max(0.4, ruralMultipliers.rho0);
    adjustedParams.rho1 *= Math.max(0.4, ruralMultipliers.rho1);
    adjustedParams.rho2 *= Math.max(0.4, ruralMultipliers.rho2);
  }

  // Apply infrastructure and workforce adjustments
  adjustedParams.mu0 *= infrastructureMultiplier * workforceMultiplier;
  adjustedParams.mu1 *= infrastructureMultiplier * workforceMultiplier;
  adjustedParams.mu2 *= infrastructureMultiplier * workforceMultiplier;
  adjustedParams.mu3 *= infrastructureMultiplier * workforceMultiplier;

  // Note: AI effectiveness is now handled in applyAIInterventions through diseaseSpecificAIEffects

  // Add country-specific metadata
  adjustedParams.countryProfile = country;
  adjustedParams.isUrban = isUrban;
  adjustedParams.diseaseSeverity = severity;
  adjustedParams.infrastructureMultiplier = infrastructureMultiplier;
  adjustedParams.healthWorkforceDensityMultiplier = workforceMultiplier;

  // Apply vertical program overrides for specific disease-country combinations
  adjustedParams = applyVerticalProgramEffects(adjustedParams, countryCode, disease, isUrban);
  
  console.log(`Final adjusted params for ${countryCode}/${disease} - lambda: ${adjustedParams.lambda}, mu0: ${adjustedParams.mu0}, deltaU: ${adjustedParams.deltaU}`);
  console.log(`Final phi0 for ${countryCode}/${disease}: ${adjustedParams.phi0}`);
  
  return adjustedParams;
}

// Get country-specific rural multipliers
function getRuralMultipliers(countryCode: string, disease: string): any {
  const baseRuralMultipliers = {
    nigeria: {
      phi0: 0.6,      // 40% reduction in care-seeking (improved from 50%)
      sigmaI: 0.5,    // 50% reduction in transition to formal care
      informalRatio: 1.6, // 60% more reliance on informal care
      mu0: 0.7, mu1: 0.6, mu2: 0.7, mu3: 0.75,
      deltaU: 1.3, deltaI: 1.3, delta0: 1.2, delta1: 1.2, delta2: 1.15, delta3: 1.1,
      rho0: 0.6, rho1: 0.5, rho2: 0.4
    },
    kenya: {
      phi0: 0.7,      // 30% reduction (better CHW coverage)
      sigmaI: 0.6,    // 40% reduction
      informalRatio: 1.5, // 50% more reliance on informal care
      mu0: 0.8, mu1: 0.7, mu2: 0.75, mu3: 0.8,
      deltaU: 1.3, deltaI: 1.3, delta0: 1.2, delta1: 1.2, delta2: 1.15, delta3: 1.1,
      rho0: 0.7, rho1: 0.6, rho2: 0.5
    },
    south_africa: {
      phi0: 0.6,      // 40% reduction
      sigmaI: 0.5,    // 50% reduction
      informalRatio: 1.4, // 40% more reliance on informal care
      mu0: 0.7, mu1: 0.6, mu2: 0.7, mu3: 0.75,
      deltaU: 1.3, deltaI: 1.4, delta0: 1.25, delta1: 1.3, delta2: 1.2, delta3: 1.15,
      rho0: 0.6, rho1: 0.5, rho2: 0.4
    },
    rwanda: {
      phi0: 0.85,     // Only 15% reduction due to strong CHW network
      sigmaI: 0.7,    // 30% reduction - people move to formal care quickly
      informalRatio: 0.10, // 10% stay untreated, 90% use informal care
      mu0: 0.75, mu1: 0.65, mu2: 0.7, mu3: 0.8, // Better rural performance due to CHW network
      deltaU: 1.2, deltaI: 1.2, delta0: 1.15, delta1: 1.15, delta2: 1.1, delta3: 1.05,
      rho0: 0.8, rho1: 0.7, rho2: 0.6 // Strong referral system
    }
  };
  
  const multipliers = baseRuralMultipliers[countryCode as keyof typeof baseRuralMultipliers] || baseRuralMultipliers.nigeria;
  
  // Disease-specific adjustments for strong vertical programs
  if (countryCode === 'kenya' && disease === 'tuberculosis') {
    // Kenya's strong TB program maintains effectiveness in rural areas
    multipliers.mu0 = 0.9;
    multipliers.mu1 = 0.85;
    multipliers.rho0 = 0.85;
  }
  
  if (countryCode === 'south_africa' && (disease === 'hiv_management_chronic' || disease === 'hiv_opportunistic')) {
    // South Africa's ART program reaches rural areas effectively
    multipliers.phi0 = 0.8;
    multipliers.mu1 = 0.8;
    multipliers.deltaU = 1.2;
  }
  
  if (disease === 'high_risk_pregnancy_low_anc') {
    // Maternal health gets priority in all countries
    multipliers.rho0 = Math.min(0.9, multipliers.rho0 * 1.3);
    multipliers.rho1 = Math.min(0.9, multipliers.rho1 * 1.3);
  }
  
  return multipliers;
}

// Apply vertical program effects that override general system weaknesses
function applyVerticalProgramEffects(
  params: CountrySpecificParameters,
  countryCode: string,
  disease: string,
  isUrban: boolean
): CountrySpecificParameters {
  // Kenya TB program
  if (countryCode === 'kenya' && disease === 'tuberculosis') {
    params.mu0 *= 1.2;  // CHWs trained in TB
    params.mu1 *= 1.3;  // Strong DOTS program
    params.phi0 = Math.max(params.phi0, 0.5); // Active case finding
  }
  
  // South Africa HIV program
  if (countryCode === 'south_africa' && (disease === 'hiv_management_chronic' || disease === 'hiv_opportunistic')) {
    params.mu1 *= 1.4;  // Excellent ART coverage
    params.mu2 *= 1.3;  // Strong hospital programs
    params.deltaU *= 0.7; // ART reduces mortality even with delays
    params.phi0 = Math.max(params.phi0, 0.7); // Active testing campaigns
  }
  
  // Nigeria malaria programs in endemic areas
  if (countryCode === 'nigeria' && disease === 'malaria') {
    params.mu0 *= 1.3;  // CHWs have RDTs and ACTs
    params.phi0 = Math.max(params.phi0, 0.4); // Community awareness high
  }
  
  // Maternal health programs (all countries)
  if (disease === 'high_risk_pregnancy_low_anc') {
    params.rho0 *= 1.5; // Priority referrals
    params.rho1 *= 1.4; // Emergency transport
    if (!isUrban) {
      params.phi0 = Math.max(params.phi0, 0.35); // Maternal waiting homes
    }
  }
  
  return params;
}

function calculateInfrastructureMultiplier(country: CountryProfile): number {
  // Based on hospital beds per 1000 population
  // Adjusted baseline to 1.5 beds per 1000 (more realistic for LMICs)
  const bedRatio = country.hospitalBedsPer1000 / 1.5;
  // More moderate reduction with higher floor
  return 0.8 + (0.2 * Math.min(bedRatio, 1)); // Range 0.8-1.0
}

function calculateWorkforceMultiplier(country: CountryProfile): number {
  // Based on physician density but accounting for task-shifting
  // Adjusted baseline to 1.0 per 1000 (more realistic for LMICs)
  const physicianRatio = country.physicianDensityPer1000 / 1.0;
  
  // Country-specific adjustments for CHW programs
  let chwBonus = 0;
  if (country.countryCode === 'KEN') {
    chwBonus = 0.15; // Kenya has strong CHW program
  } else if (country.countryCode === 'ZAF') {
    chwBonus = 0.10; // South Africa has ward-based outreach teams
  } else if (country.countryCode === 'NGA') {
    chwBonus = 0.10; // Nigeria has significant CHW programs (increased from 0.05)
  }
  
  // Range 0.8-1.1 with CHW bonus (raised floor from 0.7 to 0.8)
  return Math.min(1.1, 0.8 + (0.3 * Math.min(physicianRatio, 1)) + chwBonus);
}

// AI effectiveness is now handled directly in stockAndFlowModel through diseaseSpecificAIEffects

// Multi-condition modeling support
export interface MultiConditionScenario {
  conditions: string[];
  countryCode: string;
  isUrban: boolean;
  populationSize: number;
  // Co-morbidity effects
  mortalityMultiplier: number; // e.g., 1.5 for 50% higher mortality with multiple conditions
  resolutionReduction: number; // e.g., 0.8 for 20% slower resolution
  careSeekingBoost: number; // e.g., 1.2 for 20% more likely to seek care
}

export function createMultiConditionParameters(
  scenario: MultiConditionScenario,
  baseParamsMap: Record<string, ModelParameters>
): Record<string, CountrySpecificParameters> {
  const adjustedParams: Record<string, CountrySpecificParameters> = {};

  scenario.conditions.forEach(condition => {
    const baseParams = baseParamsMap[condition];
    if (!baseParams) return;

    // Get country-adjusted parameters
    let params = adjustParametersForCountry(
      baseParams,
      scenario.countryCode,
      scenario.isUrban,
      condition
    );

    // Apply multi-condition adjustments
    params.deltaU *= scenario.mortalityMultiplier;
    params.deltaI *= scenario.mortalityMultiplier;
    params.delta0 *= scenario.mortalityMultiplier;
    params.delta1 *= scenario.mortalityMultiplier;
    params.delta2 *= scenario.mortalityMultiplier;
    params.delta3 *= scenario.mortalityMultiplier;

    params.muI *= scenario.resolutionReduction;
    params.mu0 *= scenario.resolutionReduction;
    params.mu1 *= scenario.resolutionReduction;
    params.mu2 *= scenario.resolutionReduction;
    params.mu3 *= scenario.resolutionReduction;

    params.phi0 *= scenario.careSeekingBoost;

    adjustedParams[condition] = params;
  });

  return adjustedParams;
}

// New function for additive health system modeling
export interface HealthSystemLoad {
  diseases: string[];
  countryCode: string;
  isUrban: boolean;
  populationSize: number;
}

export function createAdditiveHealthSystemParameters(
  scenario: HealthSystemLoad,
  baseParamsMap: Record<string, ModelParameters>
): ModelParameters {
  // Start with a base template
  const baseTemplate = Object.values(baseParamsMap)[0];
  if (!baseTemplate) {
    throw new Error('No base parameters provided');
  }

  // Initialize aggregate parameters
  let aggregateParams = {
    ...baseTemplate,
    lambda: 0, // Sum of all disease incidences
    disabilityWeight: 0, // Weighted average
    meanAgeOfInfection: 0, // Weighted average
    totalCost: 0,
    dalys: 0,
    
    // Flow parameters will be weighted averages
    phi0: 0,
    sigmaI: 0,
    informalCareRatio: 0,
    
    // Clinical parameters will be weighted averages
    muI: 0, muU: 0, mu0: 0, mu1: 0, mu2: 0, mu3: 0,
    deltaU: 0, deltaI: 0, delta0: 0, delta1: 0, delta2: 0, delta3: 0,
    rho0: 0, rho1: 0, rho2: 0,
    
    // Cost parameters will be additive where appropriate
    perDiemCosts: {
      I: baseTemplate.perDiemCosts.I,
      F: baseTemplate.perDiemCosts.F,
      L0: baseTemplate.perDiemCosts.L0,
      L1: baseTemplate.perDiemCosts.L1,
      L2: baseTemplate.perDiemCosts.L2,
      L3: baseTemplate.perDiemCosts.L3
    }
  };

  let totalIncidence = 0;
  const diseaseWeights: Record<string, number> = {};

  // First pass: calculate disease weights based on incidence
  scenario.diseases.forEach(disease => {
    const baseParams = baseParamsMap[disease];
    if (!baseParams) return;

    const countryParams = adjustParametersForCountry(
      baseParams,
      scenario.countryCode,
      scenario.isUrban,
      disease
    );

    const incidence = countryParams.lambda;
    totalIncidence += incidence;
    diseaseWeights[disease] = incidence;
  });

  // Normalize weights
  Object.keys(diseaseWeights).forEach(disease => {
    diseaseWeights[disease] = diseaseWeights[disease] / totalIncidence;
  });

  // Second pass: aggregate parameters using weighted averages
  scenario.diseases.forEach(disease => {
    const baseParams = baseParamsMap[disease];
    if (!baseParams) return;

    const countryParams = adjustParametersForCountry(
      baseParams,
      scenario.countryCode,
      scenario.isUrban,
      disease
    );

    const weight = diseaseWeights[disease];

    // Sum incidences (total health system load)
    aggregateParams.lambda += countryParams.lambda;

    // Weighted averages for other parameters
    aggregateParams.disabilityWeight += countryParams.disabilityWeight * weight;
    aggregateParams.meanAgeOfInfection += countryParams.meanAgeOfInfection * weight;

    // Care-seeking behavior (weighted average)
    aggregateParams.phi0 += countryParams.phi0 * weight;
    aggregateParams.sigmaI += countryParams.sigmaI * weight;
    aggregateParams.informalCareRatio += countryParams.informalCareRatio * weight;

    // Clinical outcomes (weighted average)
    aggregateParams.muI += countryParams.muI * weight;
    aggregateParams.muU += countryParams.muU * weight;
    aggregateParams.mu0 += countryParams.mu0 * weight;
    aggregateParams.mu1 += countryParams.mu1 * weight;
    aggregateParams.mu2 += countryParams.mu2 * weight;
    aggregateParams.mu3 += countryParams.mu3 * weight;

    aggregateParams.deltaU += countryParams.deltaU * weight;
    aggregateParams.deltaI += countryParams.deltaI * weight;
    aggregateParams.delta0 += countryParams.delta0 * weight;
    aggregateParams.delta1 += countryParams.delta1 * weight;
    aggregateParams.delta2 += countryParams.delta2 * weight;
    aggregateParams.delta3 += countryParams.delta3 * weight;

    aggregateParams.rho0 += countryParams.rho0 * weight;
    aggregateParams.rho1 += countryParams.rho1 * weight;
    aggregateParams.rho2 += countryParams.rho2 * weight;
  });

  return aggregateParams as ModelParameters;
}