// Parameter rationales based on comprehensive LMIC research and validation
// These explanations help users understand why specific values were chosen

export interface ParameterRationale {
  key: string;
  rationale: string;
  sources?: string[];
}

// Disease-specific rationales
export const diseaseRationales: Record<string, ParameterRationale[]> = {
  tuberculosis: [
    {
      key: 'lambda',
      rationale: 'TB incidence of 0.615% (615 per 100,000) reflects high-burden countries like South Africa. This captures the significant disease burden in LMICs where TB remains a major public health challenge.',
      sources: ['WHO Global TB Report 2023', 'South African TB statistics']
    },
    {
      key: 'mu1',
      rationale: '4% weekly resolution rate at primary care implies ~25 weeks for standard 6-month TB treatment. This reflects the reality that TB requires long-term treatment with directly observed therapy (DOTS).',
      sources: ['WHO TB treatment guidelines', 'Lancet TB series']
    },
    {
      key: 'deltaI',
      rationale: '0.35% weekly mortality for untreated/informal care TB is higher in high-burden settings due to HIV co-infection and delayed diagnosis. Without proper treatment, TB has significant mortality.',
      sources: ['South African TB mortality data', 'WHO TB epidemiology']
    },
    {
      key: 'rho0',
      rationale: '85% CHW referral rate reflects that TB diagnosis requires laboratory confirmation (sputum smear/GeneXpert) not available at community level. CHWs play a crucial screening and referral role.',
      sources: ['WHO TB screening guidelines', 'LMIC TB program evaluations']
    }
  ],
  childhood_pneumonia: [
    {
      key: 'lambda',
      rationale: '90% annual incidence in children reflects the very high burden of respiratory infections in LMICs. Children in low-resource settings face multiple risk factors including indoor air pollution and malnutrition.',
      sources: ['IHME Global Burden of Disease', 'WHO/UNICEF pneumonia data']
    },
    {
      key: 'mu0',
      rationale: '70% weekly resolution with CHW antibiotics (e.g., Amoxicillin DT) demonstrates effectiveness of community case management for non-severe pneumonia, a key IMCI strategy in LMICs.',
      sources: ['WHO IMCI guidelines', 'Community case management studies']
    },
    {
      key: 'deltaU',
      rationale: '5% weekly mortality if completely untreated reflects the severe risk pneumonia poses to children. Without antibiotics and supportive care, pneumonia remains a leading killer of children under 5.',
      sources: ['Lancet Child Pneumonia series', 'UNICEF pneumonia mortality data']
    }
  ],
  malaria: [
    {
      key: 'lambda',
      rationale: '20% incidence in endemic Nigerian regions is higher than national average (6%) but reflects reality in high-transmission areas. Seasonal patterns and local ecology drive these high rates.',
      sources: ['Nigeria Malaria Indicator Survey', 'WHO World Malaria Report']
    },
    {
      key: 'mu0',
      rationale: '75% resolution with CHW-delivered RDTs and ACTs shows the success of community case management. When CHWs can test and treat, outcomes approach facility-based care.',
      sources: ['WHO T3 Initiative', 'Community malaria management studies']
    },
    {
      key: 'deltaI',
      rationale: '7.5% weekly mortality with informal care is comparable to untreated malaria, as traditional remedies and incomplete drug courses provide little protection against severe disease.',
      sources: ['Malaria mortality studies in Africa', 'Traditional medicine effectiveness data']
    },
    {
      key: 'delta2',
      rationale: '10% weekly mortality for severe malaria at district hospitals reflects the high case fatality of cerebral malaria and severe anemia even with treatment. Resource constraints limit intensive care.',
      sources: ['AQUAMAT trial', 'Severe malaria management studies']
    }
  ],
  diarrhea: [
    {
      key: 'lambda',
      rationale: '1.5 episodes per child-year is typical in LMICs with poor water/sanitation. Young children face repeated infections from contaminated water, poor hygiene, and malnutrition.',
      sources: ['WHO/UNICEF diarrhea burden estimates', 'GEMS study']
    },
    {
      key: 'mu0',
      rationale: '85% resolution with CHW-provided ORS/Zinc reflects the high effectiveness of this simple intervention. When properly administered, ORS prevents most diarrhea deaths.',
      sources: ['Lancet ORS series', 'Zinc supplementation trials']
    },
    {
      key: 'muI',
      rationale: '35% spontaneous resolution with home fluids shows that many mild cases resolve without formal treatment, though this carries dehydration risk if not properly managed.',
      sources: ['Community diarrhea management studies', 'Traditional rehydration practices']
    }
  ],
  congestive_heart_failure: [
    {
      key: 'meanAgeOfInfection',
      rationale: 'Mean age of 67 years reflects that CHF primarily affects older adults, though in LMICs onset may be earlier due to untreated hypertension, rheumatic heart disease, and limited preventive care.',
      sources: ['Global Heart Failure Registry', 'LMIC cardiovascular epidemiology']
    },
    {
      key: 'mu3',
      rationale: '75% resolution at tertiary hospitals with advanced cardiac care, though "resolution" in CHF means stabilization rather than cure. Requires ongoing management unavailable in many LMICs.',
      sources: ['Heart failure management guidelines', 'LMIC cardiac care capacity']
    },
    {
      key: 'deltaU',
      rationale: '9% weekly mortality if untreated reflects the severe prognosis of decompensated heart failure without diuretics, ACE inhibitors, and monitoring. Many LMIC patients lack access to essential cardiac medications.',
      sources: ['Natural history studies', 'LMIC heart failure outcomes']
    }
  ],
  hiv_management_chronic: [
    {
      key: 'lambda',
      rationale: '0.5% annual new diagnoses in South Africa reflects ongoing transmission despite large ART programs. Late diagnosis remains common, with many presenting with advanced disease.',
      sources: ['UNAIDS country data', 'South African HIV statistics']
    },
    {
      key: 'mu1',
      rationale: '10% weekly progression to stable on ART reflects the initial phase of treatment. Achieving viral suppression typically takes 3-6 months with adherence support.',
      sources: ['WHO HIV treatment guidelines', 'ART initiation studies']
    },
    {
      key: 'rho0',
      rationale: '90% CHW referral for ART initiation reflects that HIV treatment requires laboratory monitoring and physician prescription. CHWs provide crucial linkage to care and adherence support.',
      sources: ['WHO differentiated care guidelines', 'CHW HIV programs']
    }
  ]
};

// Health system-specific rationales
export const healthSystemRationales: Record<string, ParameterRationale[]> = {
  moderate_urban_system: [
    {
      key: 'phi0',
      rationale: '65% initial formal care seeking reflects moderate trust and accessibility in urban LMICs. While facilities exist, barriers include cost, wait times, and preference for traditional medicine.',
      sources: ['DHS surveys', 'Urban health seeking behavior studies']
    },
    {
      key: 'perDiemCosts.L1',
      rationale: '$40/day at primary care aligns with Kenya public sector data (~$41). Includes staff salaries, basic diagnostics, and medications in urban facilities with moderate resources.',
      sources: ['Kenya costing studies', 'WHO-CHOICE database']
    },
    {
      key: 'perDiemCosts.L2',
      rationale: '$120/day at district hospitals reflects the midpoint between Nigeria (~$100) and Kenya (~$150) public hospital costs, accounting for urban infrastructure and staffing.',
      sources: ['Multi-country hospital costing studies', 'ABCE project data']
    }
  ],
  weak_rural_system: [
    {
      key: 'phi0',
      rationale: 'Only 30% seek formal care initially due to distance, cost, and limited facility hours. Many rural residents try traditional medicine or self-treatment first.',
      sources: ['Rural health access studies', 'Distance decay analyses']
    },
    {
      key: 'informalCareRatio',
      rationale: '40% remain completely untreated - much higher than urban areas. Reflects severe access barriers where nearest facility may be hours away by foot.',
      sources: ['Geographic access studies', 'Rural health utilization data']
    },
    {
      key: 'perDiemCosts.L2',
      rationale: '$80/day at rural district hospitals reflects lower costs but also lower quality. Limited specialists, equipment, and supplies reduce both costs and effectiveness.',
      sources: ['Rural hospital studies', 'Bangladesh/Nigeria rural costing']
    },
    {
      key: 'regionalLifeExpectancy',
      rationale: '55 years life expectancy in weak rural areas reflects poor healthcare access, high maternal/child mortality, and limited management of chronic diseases.',
      sources: ['Sub-national life expectancy data', 'Rural health indicators']
    }
  ],
  strong_urban_system_lmic: [
    {
      key: 'phi0',
      rationale: '80% formal care seeking represents aspirational LMIC urban systems with good infrastructure, insurance coverage, and public trust similar to Thailand or Costa Rica.',
      sources: ['UHC exemplar countries', 'Health system performance data']
    },
    {
      key: 'perDiemCosts.L3',
      rationale: '$350/day at tertiary hospitals approaches South Africa public sector levels, reflecting investment in quality improvement and specialist services in leading LMIC cities.',
      sources: ['South Africa hospital costs', 'India urban tertiary care costs']
    }
  ],
  fragile_conflict_system: [
    {
      key: 'phi0',
      rationale: 'Only 20% seek formal care due to destroyed infrastructure, insecurity, and lack of trust. Many health facilities are non-functional or inaccessible due to conflict.',
      sources: ['Humanitarian health assessments', 'Conflict zone health surveys']
    },
    {
      key: 'perDiemCosts.L2',
      rationale: '$150/day includes 20-50% premium for security, logistics, and hazard pay. NGO-run hospitals face high costs for supplies that must be imported through insecure routes.',
      sources: ['Humanitarian costing studies', 'MSF hospital data']
    },
    {
      key: 'informalCareRatio',
      rationale: '60% untreated reflects breakdown of health systems. Even when ill, people may be unable to reach care due to active conflict, checkpoints, or destroyed facilities.',
      sources: ['Syria/Yemen health access studies', 'Humanitarian needs assessments']
    }
  ],
  hypertension: [
    {
      key: 'lambda',
      rationale: '7% annual incidence (70,000 per million) reflects new diagnoses in adults. While prevalence is 30-40% in many LMICs, annual incidence captures those entering the care cascade.',
      sources: ['Global Burden of Disease 2019', 'WHO HEARTS Initiative data']
    },
    {
      key: 'muI',
      rationale: '15% weekly resolution in informal care represents partial BP control through lifestyle changes and traditional remedies. Limited compared to medication-based treatment.',
      sources: ['Lifestyle intervention trials', 'Traditional medicine effectiveness studies']
    },
    {
      key: 'mu0',
      rationale: '40% weekly resolution at CHW level reflects basic antihypertensive therapy (e.g., hydrochlorothiazide) with BP monitoring. CHWs can manage uncomplicated hypertension effectively.',
      sources: ['Ghana CHPS program', 'AMPATH Kenya hypertension program']
    },
    {
      key: 'mu1',
      rationale: '65% weekly resolution at primary care represents combination therapy achieving target BP. Most patients require 2-3 medications for adequate control.',
      sources: ['SPRINT trial', 'LMIC hypertension control programs']
    },
    {
      key: 'deltaI',
      rationale: '0.08% weekly mortality (4% annually) for poorly controlled hypertension reflects cardiovascular event risk. Low weekly rate but accumulates significantly over time.',
      sources: ['Framingham risk equations', 'LMIC cardiovascular mortality data']
    },
    {
      key: 'selfCareAI',
      rationale: 'Home BP monitoring with AI achieves 40% resolution improvement through medication adherence, lifestyle coaching, and early detection of dangerous readings. Transforms chronic disease management.',
      sources: ['Digital therapeutics trials', 'Rwanda Babylon Health pilot', 'mHealth BP studies']
    }
  ]
};

// AI intervention rationales
export const aiInterventionRationales: Record<string, ParameterRationale> = {
  triageAI_fixed: {
    key: 'triageAI.fixed',
    rationale: '$200,000 fixed cost includes software licensing, tablet/computer hardware for ~20 hospitals, networking infrastructure, and intensive staff training. Based on digital health pilots in Tanzania and Kenya.',
    sources: ['Digital health implementation studies', 'mHealth cost analyses']
  },
  triageAI_variable: {
    key: 'triageAI.variable',
    rationale: '$2.50 per patient at scale covers cloud computing, data storage, and ongoing support. Decreases from pilot costs (~$5) due to economies of scale.',
    sources: ['Cloud healthcare costs', 'AI operational cost studies']
  },
  chwAI_fixed: {
    key: 'chwAI.fixed',
    rationale: '$150,000 covers smartphones/tablets for CHWs, training programs, and supervision systems. Lower than facility-based AI due to simpler devices and integration needs.',
    sources: ['CHW digital health programs', 'CommCare/DHIS2 implementations']
  },
  chwAI_variable: {
    key: 'chwAI.variable',
    rationale: '$1.50 per consultation mainly for mobile data costs. In rural areas, this may require offline-first design with periodic syncing to minimize data use.',
    sources: ['mHealth data costs in Africa', 'CHW program operational costs']
  },
  diagnosticAI_fixed: {
    key: 'diagnosticAI.fixed',
    rationale: '$300,000 includes AI software licensing and critically, upgrading to digital diagnostic equipment (e.g., digital X-ray machines for TB screening) which many LMIC facilities lack.',
    sources: ['CAD4TB implementation studies', 'Digital diagnostic costs']
  },
  diagnosticAI_variable: {
    key: 'diagnosticAI.variable',
    rationale: '$1.00 per test at high volume based on TB CAD software pricing. Ranges from $0.25-2.50 depending on volume agreements and specific diagnostic type.',
    sources: ['WHO AI TB screening guidelines', 'Pakistan CAD4TB costing']
  },
  bedManagementAI_fixed: {
    key: 'bedManagementAI.fixed',
    rationale: '$250,000 for IT infrastructure in major hospitals, as many LMIC hospitals lack electronic bed tracking systems that AI requires. Includes basic HIS implementation.',
    sources: ['Hospital IT implementation costs', 'LMIC HIS studies']
  },
  hospitalDecisionAI_fixed: {
    key: 'hospitalDecisionAI.fixed',
    rationale: '$400,000 reflects complex EHR integration needs. Most LMIC hospitals lack comprehensive EHRs, so this includes basic digitization before AI can be deployed.',
    sources: ['EHR implementation in LMICs', 'Clinical decision support costs']
  },
  selfCareAI_fixed: {
    key: 'selfCareAI.fixed',
    rationale: '$100,000 for app development and localization based on Rwanda\'s Babylon (Babyl) experience. Includes translation, local clinical validation, and initial marketing.',
    sources: ['Babylon Rwanda case study', 'mHealth app development costs']
  },
  selfCareAI_variable: {
    key: 'selfCareAI.variable',
    rationale: '$0.50 per user per year at scale covers server costs and basic support. Rwanda\'s experience showed this is sustainable only with government subsidy or insurance integration.',
    sources: ['Babylon operational costs', 'Digital health sustainability studies']
  },
  selfCareAI_scaleFactor: {
    key: 'selfCareAI.scaleFactor',
    rationale: '60% cost reduction at national scale (0.4 factor) as software development is one-time but support costs remain. Based on digital health scaling studies.',
    sources: ['mHealth scaling studies', 'Digital health economies of scale']
  }
};

// General economic parameter rationales
export const economicRationales: Record<string, ParameterRationale> = {
  discountRate: {
    key: 'discountRate',
    rationale: 'Standard 3% annual discount rate for health economic evaluations, though some argue for 0% when valuing future health benefits in LMICs with young populations.',
    sources: ['WHO-CHOICE guidelines', 'Health economics best practices']
  },
  yearsOfLifeLost: {
    key: 'yearsOfLifeLost',
    rationale: 'Base YLL parameter adjusted by actual age of death and regional life expectancy. Reflects that premature deaths in young populations have higher DALY impact.',
    sources: ['IHME DALY methodology', 'WHO burden of disease methods']
  },
  'perDiemCosts.I': {
    key: 'perDiemCosts.I',
    rationale: 'Informal care costs ($5-15/day) include traditional healers, drug shops, and self-medication. Lower than formal care but still significant for poor households who often pay out-of-pocket.',
    sources: ['Traditional medicine cost studies', 'Pharmacy utilization surveys']
  },
  'perDiemCosts.F': {
    key: 'perDiemCosts.F',
    rationale: 'Formal entry point costs ($10-30/day) cover triage, registration, and initial assessment. Includes staff time and basic diagnostics before patients are assigned to care levels.',
    sources: ['Facility costing studies', 'Time-and-motion analyses']
  },
  'perDiemCosts.L0': {
    key: 'perDiemCosts.L0',
    rationale: 'CHW costs ($8-25/day) include stipends, basic supplies, and supervision. Lower than facility care but critical for community case management of pneumonia, diarrhea, and malaria.',
    sources: ['CHW program evaluations', 'Community health costing studies']
  },
  'perDiemCosts.L1': {
    key: 'perDiemCosts.L1',
    rationale: 'Primary care costs ($20-50/day) based on Kenya (~$41) and India (~$35) public sector data. Includes outpatient consultations, basic labs, and essential medications.',
    sources: ['Kenya health facility costs', 'India public hospital data', 'WHO-CHOICE']
  },
  'perDiemCosts.L2': {
    key: 'perDiemCosts.L2',
    rationale: 'District hospital costs ($80-180/day) reflect inpatient care with basic surgery and specialists. Research shows Nigeria ~$100, Kenya ~$150, varying by infrastructure and case mix.',
    sources: ['Multi-country hospital costing', 'ABCE project', 'DCP3 surgical costs']
  },
  'perDiemCosts.L3': {
    key: 'perDiemCosts.L3',
    rationale: 'Tertiary hospital costs ($200-500/day) for ICU, complex procedures, and subspecialists. South Africa public ~$200/day provides a realistic LMIC benchmark for quality tertiary care.',
    sources: ['South African hospital costs', 'Tertiary care costing studies']
  },
  muU: {
    key: 'muU',
    rationale: 'Spontaneous resolution rate for untreated patients (5% weekly) reflects that some conditions self-resolve, especially viral infections, though with higher risk of complications.',
    sources: ['Natural history studies', 'Untreated disease outcomes']
  }
};

// Function to get rationale for a specific parameter
export function getParameterRationale(
  paramKey: string,
  disease?: string,
  healthSystem?: string
): string {
  // Check disease-specific rationales
  if (disease && diseaseRationales[disease]) {
    const diseaseRationale = diseaseRationales[disease].find(r => r.key === paramKey);
    if (diseaseRationale) return diseaseRationale.rationale;
  }

  // Check health system-specific rationales
  if (healthSystem && healthSystemRationales[healthSystem]) {
    const hsRationale = healthSystemRationales[healthSystem].find(r => r.key === paramKey);
    if (hsRationale) return hsRationale.rationale;
  }

  // Check AI intervention rationales
  const aiRationale = aiInterventionRationales[paramKey];
  if (aiRationale) return aiRationale.rationale;

  // Check general economic rationales
  const econRationale = economicRationales[paramKey];
  if (econRationale) return econRationale.rationale;

  // Default message if no specific rationale found
  return 'This parameter is based on clinical evidence and health system data from low and middle-income countries.';
}