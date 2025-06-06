import React, { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { 
  baseParametersAtom,
  derivedParametersAtom, 
  populationSizeAtom, 
  aiInterventionsAtom,
  healthSystemMultipliersAtom,
  HealthSystemMultipliers,
  selectedDiseasesAtom,
  individualDiseaseParametersAtom
} from '../lib/store';
import * as d3 from 'd3';

interface Node {
  id: string;
  name: string;
  description: string;
  type: 'stock' | 'informal' | 'formal' | 'level0' | 'level1' | 'level2' | 'level3' | 'outcome' | 'queue';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Link {
  id: string;
  source: string;
  target: string;
  label: string;
  value: number | null;
  aiIntervention: string | null;
  parameter: string | null;
  controlPoints: {x1: number, y1: number}; // Quadratic Bezier control point
  labelOffset?: {dx?: number, dy?: number}; // Optional offset for label positioning
}

interface StockFlowDiagramProps {
  selectedDisease?: string;
  onDiseaseChange?: (disease: string) => void;
}

const StockFlowDiagram: React.FC<StockFlowDiagramProps> = ({ selectedDisease, onDiseaseChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [baseParams] = useAtom(baseParametersAtom);
  const [derivedParams] = useAtom(derivedParametersAtom);
  const [population] = useAtom(populationSizeAtom);
  const [aiInterventions] = useAtom(aiInterventionsAtom);
  const [activeMultipliers] = useAtom(healthSystemMultipliersAtom);
  const [selectedDiseases] = useAtom(selectedDiseasesAtom);
  const [individualDiseaseParams] = useAtom(individualDiseaseParametersAtom);
  
  // State for selected disease in multi-disease mode
  const [selectedDiseaseForDiagram, setSelectedDiseaseForDiagram] = useState<string>('');
  
  // Determine if we're in multi-disease mode
  const isMultiDiseaseMode = selectedDiseases.length > 1;
  
  // Use prop if provided, otherwise manage state internally
  const effectiveSelectedDisease = selectedDisease || selectedDiseaseForDiagram;
  const effectiveOnDiseaseChange = onDiseaseChange || setSelectedDiseaseForDiagram;
  
  // Initialize selected disease for diagram
  useEffect(() => {
    if (isMultiDiseaseMode && !effectiveSelectedDisease) {
      effectiveOnDiseaseChange(selectedDiseases[0]);
    }
  }, [isMultiDiseaseMode, selectedDiseases, effectiveSelectedDisease]);

  // Get parameters for the currently selected disease
  const params = isMultiDiseaseMode && effectiveSelectedDisease 
    ? individualDiseaseParams[effectiveSelectedDisease] || derivedParams
    : derivedParams;
  
  // System congestion is a global parameter, not disease-specific
  const systemCongestion = derivedParams.systemCongestion || 0;
  
  // Weekly incidence
  const weeklyIncidence = (params.lambda * population) / 52;

  // Helper for Unicode multiplier symbols
  const getUnicodeMultiplierSymbol = (type: 'mu' | 'delta' | 'rho', level: string): string => {
    let greekLetter = '';
    if (type === 'mu') greekLetter = '\u03B1'; // α
    else if (type === 'delta') greekLetter = '\u03B2'; // β
    else if (type === 'rho') greekLetter = '\u03B3'; // γ
    
    const subscriptMap: {[key: string]: string} = {
        'U': '\u1D64', // ᵤ
        'I': '\u1D62', // ᵢ
        'L0': '\u2080', // ₀
        'L1': '\u2081', // ₁
        'L2': '\u2082', // ₂
        'L3': '\u2083'  // ₃
    };
    const subscript = level ? subscriptMap[level.toUpperCase()] || level.toUpperCase() : '';
    return `${greekLetter}${subscript}`;
  };
  
  // Helper for base parameter Unicode symbols
  const getUnicodeBaseSymbol = (type: 'mu' | 'delta' | 'rho' | 'phi' | 'sigma', level?: string): string => {
    let baseLetter = '';
    if (type === 'mu') baseLetter = '\u03BC'; // μ
    else if (type === 'delta') baseLetter = '\u03B4'; // δ
    else if (type === 'rho') baseLetter = '\u03C1'; // ρ
    else if (type === 'phi') baseLetter = '\u03C6'; // φ
    else if (type === 'sigma') baseLetter = '\u03C3'; // σ
    
    const subscriptMap: {[key: string]: string} = {
        '0': '\u2080', // ₀ (for phi0, mu0, delta0, rho0)
        '1': '\u2081', // ₁ (for mu1, delta1, rho1)
        '2': '\u2082', // ₂ (for mu2, delta2, rho2)
        '3': '\u2083', // ₃ (for mu3, delta3)
        'U': '\u1D64', // ᵤ (for deltaU)
        'I': '\u1D62'  // ᵢ (for muI, deltaI, sigmaI)
    };
    // Adjust level for specific cases like phi0
    const effectiveLevel = (type === 'phi' && level === '0') ? '0' : level;
    const subscript = effectiveLevel ? subscriptMap[effectiveLevel.toUpperCase()] || effectiveLevel.toUpperCase() : '';
    return `${baseLetter}${subscript}`;
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodeWidth = 150;
    const nodeHeight = 50;
    const pullBackOffset = (nodeHeight / 2) + 10; // Increased pullback for arrows from 5 to 10

    const nodes: Node[] = [
      { id: 'new', name: 'New Cases', description: 'New cases per week', type: 'stock', x: 50, y: 325, width: nodeWidth, height: nodeHeight },
      { id: 'formal', name: 'Formal Care', description: 'Entry to health system', type: 'formal', x: 250, y: 150, width: nodeWidth, height: nodeHeight },
      { id: 'informal', name: 'Informal Care', description: 'Self-care/traditional healers', type: 'informal', x: 250, y: 325, width: nodeWidth, height: nodeHeight },
      { id: 'untreated', name: 'Untreated', description: 'No care received', type: 'stock', x: 250, y: 500, width: nodeWidth, height: nodeHeight },
      { id: 'l0', name: 'CHW (L0)', description: 'Community Health Workers', type: 'level0', x: 650, y: 100, width: nodeWidth, height: nodeHeight },
      { id: 'l1', name: 'Primary (L1)', description: 'Primary Care Facilities', type: 'level1', x: 650, y: 250, width: nodeWidth, height: nodeHeight },
      { id: 'l2', name: 'District (L2)', description: 'District Hospitals', type: 'level2', x: 650, y: 400, width: nodeWidth, height: nodeHeight },
      { id: 'l3', name: 'Tertiary (L3)', description: 'Tertiary Hospitals', type: 'level3', x: 650, y: 550, width: nodeWidth, height: nodeHeight },
      { id: 'resolved', name: 'Resolved', description: 'Cases resolved', type: 'outcome', x: 1100, y: 200, width: nodeWidth, height: nodeHeight },
      { id: 'deaths', name: 'Deaths', description: 'Deaths from all causes', type: 'outcome', x: 1100, y: 450, width: nodeWidth, height: nodeHeight },
    ];
    
    // Add queue nodes if congestion exists
    const queueNodes: Node[] = [];
    if (systemCongestion && systemCongestion > 0) {
      queueNodes.push(
        { id: 'q0', name: 'Q₀', description: 'Queue for CHW', type: 'queue', x: 400, y: 50, width: 60, height: 40 },
        { id: 'q1', name: 'Q₁', description: 'Queue for Primary', type: 'queue', x: 400, y: 200, width: 60, height: 40 },
        { id: 'q2', name: 'Q₂', description: 'Queue for District', type: 'queue', x: 400, y: 350, width: 60, height: 40 },
        { id: 'q3', name: 'Q₃', description: 'Queue for Tertiary', type: 'queue', x: 400, y: 500, width: 60, height: 40 }
      );
    }
    
    const allNodes = [...nodes, ...queueNodes];

    const fmt = (num: number) => num < 0.01 && num !== 0 ? num.toFixed(4) : num < 0.1 && num !== 0 ? num.toFixed(3) : num.toFixed(2);

    // Calculate capacity constraints for flow rates
    const congestion = systemCongestion;
    const competitionSensitivity = derivedParams.competitionSensitivity || 1.0;
    // Remove the cap to allow over-congestion effects (effectiveCongestion can now be > 1)
    const effectiveCongestion = congestion * competitionSensitivity;
    // Use linear function for capacity reduction (matches model)
    const capacityMultiplier = Math.max(0.2, 1 - (effectiveCongestion * 0.5));
    
    // System adaptation when congested - staff work harder, treat more locally
    let muBoost = 1.0;
    let rhoReduction = 1.0;
    if (congestion > 0.5) {
      // Staff work faster when overwhelmed: up to 20% faster resolution
      muBoost = 1 + ((congestion - 0.5) * 0.4);
      // Fewer referrals when congested: up to 30% reduction
      rhoReduction = 1 - ((congestion - 0.5) * 0.6);
    }
    
    // Calculate effective flow rates (capacity-constrained and adapted when congestion > 0)
    const effectiveRho0 = params.rho0 * capacityMultiplier * rhoReduction;
    const effectiveRho1 = params.rho1 * capacityMultiplier * rhoReduction;
    const effectiveRho2 = params.rho2 * capacityMultiplier * rhoReduction;
    const effectiveFormalToL0 = 1.0 * capacityMultiplier; // Formal care to L0 is also capacity constrained

    // Calculate arrival multiplier for congestion feedback
    const arrivalMultiplier = congestion > 0.5 ? 1 - ((congestion - 0.5) * 0.5) : 1.0;
    const showArrivalReduction = congestion > 0.5;
    
    let links: Link[] = [
      // From New Cases
      { id: 'link_new_untreated', source: 'new', target: 'untreated', label: `(1-${getUnicodeBaseSymbol('phi', '0')})r: ${fmt((1 - params.phi0) * params.informalCareRatio)}${showArrivalReduction ? ` × ${fmt(arrivalMultiplier)}` : ''}`, value: (1 - params.phi0) * params.informalCareRatio * weeklyIncidence * arrivalMultiplier, aiIntervention: null, parameter: null, controlPoints: { x1: 150, y1: 475 }, labelOffset: {dy: -15} },
      { id: 'link_new_informal', source: 'new', target: 'informal', label: `(1-${getUnicodeBaseSymbol('phi', '0')})(1-r): ${fmt((1 - params.phi0) * (1 - params.informalCareRatio))}${showArrivalReduction ? ` × ${fmt(arrivalMultiplier)}` : ''}`, value: (1 - params.phi0) * (1 - params.informalCareRatio) * weeklyIncidence * arrivalMultiplier, aiIntervention: null, parameter: null, controlPoints: { x1: 150, y1: 325 } },
      { id: 'link_new_formal', source: 'new', target: 'formal', label: `${getUnicodeBaseSymbol('phi', '0')}: ${fmt(params.phi0)}${showArrivalReduction ? ` × ${fmt(arrivalMultiplier)}` : ''}`, value: params.phi0 * weeklyIncidence * arrivalMultiplier, aiIntervention: (aiInterventions.triageAI || aiInterventions.selfCareAI) ? (aiInterventions.triageAI ? 'triageAI' : 'selfCareAI') : null, parameter: 'phi0', controlPoints: { x1: 150, y1: 175 }, labelOffset: {dy: -15} },
      
      // From Untreated to Deaths
      { id: 'link_untreated_deaths', source: 'untreated', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', 'U')}: ${fmt(params.deltaU)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 675, y1: 500 }, labelOffset: {dx: 30, dy: 15} },
      
      // From Untreated to Resolved (new link for spontaneous recovery)
      { id: 'link_untreated_resolved', source: 'untreated', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', 'U')}: ${fmt(params.muU)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 675, y1: 325 }, labelOffset: {dy: 20, dx: 10} },
      
      // From Informal Care
      { id: 'link_informal_formal', source: 'informal', target: 'formal', label: `${getUnicodeBaseSymbol('sigma', 'I')}: ${fmt(params.sigmaI)}`, value: null, aiIntervention: (aiInterventions.triageAI || aiInterventions.selfCareAI) ? (aiInterventions.triageAI ? 'triageAI' : 'selfCareAI') : null, parameter: 'sigmaI', controlPoints: { x1: 250, y1: 225 }, labelOffset: {dx: -20} },
      { id: 'link_informal_resolved', source: 'informal', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', 'I')}: ${fmt(params.muI)}`, value: null, aiIntervention: aiInterventions.selfCareAI ? 'selfCareAI' : null, parameter: 'muI', controlPoints: { x1: 675, y1: 225 }, labelOffset: {dy: -20} },
      { id: 'link_informal_deaths', source: 'informal', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', 'I')}: ${fmt(params.deltaI)}`, value: null, aiIntervention: aiInterventions.selfCareAI ? 'selfCareAI' : null, parameter: 'deltaI', controlPoints: { x1: 675, y1: 375 }, labelOffset: {dy: 20} },
      
      // From Formal Care to L0 only
      { id: 'link_formal_l0', source: 'formal', target: 'l0', label: `(to L0): ${fmt(effectiveFormalToL0)}${congestion > 0 ? '*' : ''}`, value: null, aiIntervention: aiInterventions.triageAI ? 'triageAI' : null, parameter: null, controlPoints: { x1: 450, y1: 125 }, labelOffset: {dy: -10} },
      
      // From L0 (CHW)
      { id: 'link_l0_l1', source: 'l0', target: 'l1', label: `${getUnicodeBaseSymbol('rho', '0')}: ${fmt(effectiveRho0)}${congestion > 0 ? '*' : ''}`, value: null, aiIntervention: aiInterventions.chwAI ? 'chwAI' : null, parameter: 'rho0', controlPoints: { x1: 650, y1: 175 }, labelOffset: {dx: -25} },
      { id: 'link_l0_resolved', source: 'l0', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', '0')}: ${fmt(params.mu0 * muBoost)}${congestion > 0.5 ? '*' : ''}`, value: null, aiIntervention: aiInterventions.chwAI ? 'chwAI' : null, parameter: 'mu0', controlPoints: { x1: 875, y1: 150 }, labelOffset: {dy: -15} },
      { id: 'link_l0_deaths', source: 'l0', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', '0')}: ${fmt(params.delta0)}`, value: null, aiIntervention: aiInterventions.chwAI ? 'chwAI' : null, parameter: 'delta0', controlPoints: { x1: 875, y1: 300 }, labelOffset: {dy: 25, dx: 20} },
      
      // From L1 (Primary)
      { id: 'link_l1_l2', source: 'l1', target: 'l2', label: `${getUnicodeBaseSymbol('rho', '1')}: ${fmt(effectiveRho1)}${congestion > 0 ? '*' : ''}`, value: null, aiIntervention: aiInterventions.diagnosticAI ? 'diagnosticAI' : null, parameter: 'rho1', controlPoints: { x1: 650, y1: 325 }, labelOffset: {dx: -25} },
      { id: 'link_l1_resolved', source: 'l1', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', '1')}: ${fmt(params.mu1 * muBoost)}${congestion > 0.5 ? '*' : ''}`, value: null, aiIntervention: aiInterventions.diagnosticAI ? 'diagnosticAI' : null, parameter: 'mu1', controlPoints: { x1: 875, y1: 225 }, labelOffset: {dy: -15} },
      { id: 'link_l1_deaths', source: 'l1', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', '1')}: ${fmt(params.delta1)}`, value: null, aiIntervention: aiInterventions.diagnosticAI ? 'diagnosticAI' : null, parameter: 'delta1', controlPoints: { x1: 875, y1: 350 }, labelOffset: {dy: 20} },
      
      // From L2 (District)
      { id: 'link_l2_l3', source: 'l2', target: 'l3', label: `${getUnicodeBaseSymbol('rho', '2')}: ${fmt(effectiveRho2)}${congestion > 0 ? '*' : ''}`, value: null, aiIntervention: aiInterventions.diagnosticAI ? 'diagnosticAI' : null, parameter: 'rho2', controlPoints: { x1: 650, y1: 475 }, labelOffset: {dx: -25} },
      { id: 'link_l2_resolved', source: 'l2', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', '2')}: ${fmt(params.mu2 * muBoost)}${congestion > 0.5 ? '*' : ''}`, value: null, aiIntervention: (aiInterventions.diagnosticAI || aiInterventions.bedManagementAI) ? (aiInterventions.diagnosticAI ? 'diagnosticAI' : 'bedManagementAI') : null, parameter: 'mu2', controlPoints: { x1: 875, y1: 325 }, labelOffset: {dy: -20} },
      { id: 'link_l2_deaths', source: 'l2', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', '2')}: ${fmt(params.delta2)}`, value: null, aiIntervention: (aiInterventions.diagnosticAI || aiInterventions.hospitalDecisionAI) ? (aiInterventions.diagnosticAI ? 'diagnosticAI' : 'hospitalDecisionAI') : null, parameter: 'delta2', controlPoints: { x1: 875, y1: 425 }, labelOffset: {dy: 20} },
      
      // From L3 (Tertiary)
      { id: 'link_l3_resolved', source: 'l3', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', '3')}: ${fmt(params.mu3 * muBoost)}${congestion > 0.5 ? '*' : ''}`, value: null, aiIntervention: aiInterventions.bedManagementAI ? 'bedManagementAI' : null, parameter: 'mu3', controlPoints: { x1: 875, y1: 375 }, labelOffset: {dy: -20, dx: -15} },
      { id: 'link_l3_deaths', source: 'l3', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', '3')}: ${fmt(params.delta3)}`, value: null, aiIntervention: aiInterventions.hospitalDecisionAI ? 'hospitalDecisionAI' : null, parameter: 'delta3', controlPoints: { x1: 875, y1: 500 }, labelOffset: {dy: 15} },
    ];
    
    // Add direct routing bypass flows when congestion > 0.5
    const directRoutingImprovement = derivedParams.directRoutingImprovement || 0;
    if (directRoutingImprovement > 0 && congestion > 0.5) {
      const bypassProbability = directRoutingImprovement * congestion;
      links.push(
        { id: 'link_formal_l1_direct', source: 'formal', target: 'l1', 
          label: `Direct L1: ${fmt(bypassProbability * 0.6)}`, 
          value: null, aiIntervention: aiInterventions.selfCareAI ? 'selfCareAI' : null, parameter: null, 
          controlPoints: { x1: 450, y1: 225 }, labelOffset: {dy: -10} },
        { id: 'link_formal_l2_direct', source: 'formal', target: 'l2', 
          label: `Direct L2: ${fmt(bypassProbability * 0.4)}`, 
          value: null, aiIntervention: aiInterventions.selfCareAI ? 'selfCareAI' : null, parameter: null, 
          controlPoints: { x1: 450, y1: 375 }, labelOffset: {dy: -10} },
      );
    }
    
    // Add queue links if congestion exists
    if (systemCongestion && systemCongestion > 0) {
      // Calculate queue flow rates based on model parameters
      const congestion = systemCongestion;
      const competitionSensitivity = derivedParams.competitionSensitivity || 0.5;
      // Remove the cap to allow over-congestion effects (effectiveCongestion can now be > 1)
      const effectiveCongestion = congestion * competitionSensitivity;
      
      // Queue dynamics parameters
      const queueAbandonmentRate = derivedParams.queueAbandonmentRate || 0.05;
      const queueBypassRate = derivedParams.queueBypassRate || 0.10;
      const queueClearanceRate = derivedParams.queueClearanceRate || 0.3;
      
      // AI effects on queue clearance
      const resolutionBoostEffect = derivedParams.resolutionBoost || 0;
      const pointOfCareEffect = derivedParams.pointOfCareResolution || 0;
      const lengthOfStayEffect = derivedParams.lengthOfStayReduction || 0;
      const dischargeOptEffect = derivedParams.dischargeOptimization || 0;
      const treatmentEffEffect = derivedParams.treatmentEfficiency || 0;
      const resourceUtilEffect = derivedParams.resourceUtilization || 0;
      
      // Calculate available capacity with AI improvements
      // Use exponential function for more sensitivity at high congestion levels
      const capacityMultiplierForQueues = Math.max(0.2, 1 - (effectiveCongestion * 0.5));
      const baseCapacity = capacityMultiplierForQueues * queueClearanceRate;
      const availableCapacityL0 = Math.max(0, baseCapacity * (1 + resolutionBoostEffect));
      const availableCapacityL1 = Math.max(0, baseCapacity * (1 + pointOfCareEffect));
      const availableCapacityL2 = Math.max(0, baseCapacity * (1 + lengthOfStayEffect + dischargeOptEffect + treatmentEffEffect));
      const availableCapacityL3 = Math.max(0, baseCapacity * (1 + lengthOfStayEffect + dischargeOptEffect + treatmentEffEffect + resourceUtilEffect));
      
      // Calculate queue mortality rates - same as untreated mortality
      const queueMortalityRate = params.deltaU;
      
      // Calculate queue entry rate (proportion of demand that gets queued due to capacity constraints)
      // Use a sigmoid function to map effectiveCongestion to a 0-1 range
      const queueEntryRate = 1 / (1 + Math.exp(-2 * (effectiveCongestion - 0.5)));
      // Formal care to queues (when capacity is constrained)
      links.push(
        { id: 'link_formal_q0', source: 'formal', target: 'q0', label: `Queue: ${fmt(queueEntryRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 325, y1: 100 }, labelOffset: {dy: -10} },
        { id: 'link_l0_q1', source: 'l0', target: 'q1', label: `Queue: ${fmt(queueEntryRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 525, y1: 150 }, labelOffset: {dy: -10} },
        { id: 'link_l1_q2', source: 'l1', target: 'q2', label: `Queue: ${fmt(queueEntryRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 525, y1: 300 }, labelOffset: {dy: -10} },
        { id: 'link_l2_q3', source: 'l2', target: 'q3', label: `Queue: ${fmt(queueEntryRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 525, y1: 450 }, labelOffset: {dy: -10} },
      );
      
      // Queues to healthcare levels (clearance)
      links.push(
        { id: 'link_q0_l0', source: 'q0', target: 'l0', label: `Clear: ${fmt(availableCapacityL0)}`, value: null, aiIntervention: aiInterventions.chwAI ? 'chwAI' : null, parameter: null, controlPoints: { x1: 525, y1: 75 }, labelOffset: {dy: -10} },
        { id: 'link_q1_l1', source: 'q1', target: 'l1', label: `Clear: ${fmt(availableCapacityL1)}`, value: null, aiIntervention: aiInterventions.diagnosticAI ? 'diagnosticAI' : null, parameter: null, controlPoints: { x1: 525, y1: 225 }, labelOffset: {dy: -10} },
        { id: 'link_q2_l2', source: 'q2', target: 'l2', label: `Clear: ${fmt(availableCapacityL2)}`, value: null, aiIntervention: (aiInterventions.bedManagementAI || aiInterventions.hospitalDecisionAI) ? (aiInterventions.bedManagementAI ? 'bedManagementAI' : 'hospitalDecisionAI') : null, parameter: null, controlPoints: { x1: 525, y1: 375 }, labelOffset: {dy: -10} },
        { id: 'link_q3_l3', source: 'q3', target: 'l3', label: `Clear: ${fmt(availableCapacityL3)}`, value: null, aiIntervention: (aiInterventions.bedManagementAI || aiInterventions.hospitalDecisionAI) ? (aiInterventions.bedManagementAI ? 'bedManagementAI' : 'hospitalDecisionAI') : null, parameter: null, controlPoints: { x1: 525, y1: 525 }, labelOffset: {dy: -10} },
      );
      
      // Queue mortality - all queues have same mortality rate (untreated)
      links.push(
        { id: 'link_q0_deaths', source: 'q0', target: 'deaths', label: `Q-mort: ${fmt(queueMortalityRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 750, y1: 250 }, labelOffset: {dy: 10} },
        { id: 'link_q1_deaths', source: 'q1', target: 'deaths', label: `Q-mort: ${fmt(queueMortalityRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 750, y1: 300 }, labelOffset: {dy: 10} },
        { id: 'link_q2_deaths', source: 'q2', target: 'deaths', label: `Q-mort: ${fmt(queueMortalityRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 750, y1: 375 }, labelOffset: {dy: 10} },
        { id: 'link_q3_deaths', source: 'q3', target: 'deaths', label: `Q-mort: ${fmt(queueMortalityRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 750, y1: 475 }, labelOffset: {dy: 10} },
      );
      
      // Queue abandonment/bypass
      links.push(
        { id: 'link_q0_informal', source: 'q0', target: 'informal', label: `Abandon: ${fmt(queueAbandonmentRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 325, y1: 200 }, labelOffset: {dy: -10} },
        { id: 'link_q1_informal', source: 'q1', target: 'informal', label: `Abandon: ${fmt(queueAbandonmentRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 325, y1: 275 }, labelOffset: {dy: -10} },
        { id: 'link_q2_informal', source: 'q2', target: 'informal', label: `Abandon: ${fmt(queueAbandonmentRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 325, y1: 350 }, labelOffset: {dy: -10} },
        { id: 'link_q3_informal', source: 'q3', target: 'informal', label: `Abandon: ${fmt(queueAbandonmentRate)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 325, y1: 425 }, labelOffset: {dy: -10} },
      );
      
      // Queue self-resolution flows
      const queueSelfResolveRate = derivedParams.queueSelfResolveRate || 0.10;
      links.push(
        { id: 'link_q0_resolved', source: 'q0', target: 'resolved', 
          label: `Self-resolve: ${fmt(queueSelfResolveRate)}`, 
          value: null, aiIntervention: null, parameter: null, 
          controlPoints: { x1: 750, y1: 125 }, labelOffset: {dy: -10} },
        { id: 'link_q1_resolved', source: 'q1', target: 'resolved', 
          label: `Self-resolve: ${fmt(queueSelfResolveRate)}`, 
          value: null, aiIntervention: null, parameter: null, 
          controlPoints: { x1: 750, y1: 225 }, labelOffset: {dy: -10} },
        { id: 'link_q2_resolved', source: 'q2', target: 'resolved', 
          label: `Self-resolve: ${fmt(queueSelfResolveRate)}`, 
          value: null, aiIntervention: null, parameter: null, 
          controlPoints: { x1: 750, y1: 350 }, labelOffset: {dy: -10} },
        { id: 'link_q3_resolved', source: 'q3', target: 'resolved', 
          label: `Self-resolve: ${fmt(queueSelfResolveRate)}`, 
          value: null, aiIntervention: null, parameter: null, 
          controlPoints: { x1: 750, y1: 500 }, labelOffset: {dy: -10} },
      );
    }

    const svgWidth = 1300;
    const svgHeight = 700;

    svg
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('background', '#f8f9fa');

    // Define Arrowhead Markers
    const markerPath = 'M0,-4L8,0L0,4'; // Wider and longer arrowhead path
    const markerViewBox = '-1 -5 10 10';    // Adjusted viewBox for new path
    const markerWidth = 8;                // Larger marker width
    const markerHeight = 8;               // Larger marker height
    const markerRefX = 5;                 // Pull back from tip slightly to make more visible

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead-default').attr('viewBox', markerViewBox)
      .attr('refX', markerRefX).attr('refY', 0).attr('orient', 'auto')
      .attr('markerWidth', markerWidth).attr('markerHeight', markerHeight)
      .append('path').attr('d', markerPath).attr('fill', '#555');

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead-ai').attr('viewBox', markerViewBox)
      .attr('refX', markerRefX).attr('refY', 0).attr('orient', 'auto')
      .attr('markerWidth', markerWidth).attr('markerHeight', markerHeight)
      .append('path').attr('d', markerPath).attr('fill', '#28a745');
    
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead-highlight').attr('viewBox', markerViewBox)
      .attr('refX', markerRefX).attr('refY', 0).attr('orient', 'auto')
      // Highlighted marker keeps same size, only color changes via link stroke
      .attr('markerWidth', markerWidth).attr('markerHeight', markerHeight) 
      .append('path').attr('d', markerPath).attr('fill', '#007bff');

    function getQuadraticBezierXYatT(startPt: {x:number, y:number}, controlPtRaw: {x1:number, y1:number}, endPt: {x:number, y:number}, T: number) {
      const controlPt = { x: controlPtRaw.x1, y: controlPtRaw.y1 };
      const x = Math.pow(1 - T, 2) * startPt.x + 2 * (1 - T) * T * controlPt.x + Math.pow(T, 2) * endPt.x;
      const y = Math.pow(1 - T, 2) * startPt.y + 2 * (1 - T) * T * controlPt.y + Math.pow(T, 2) * endPt.y;
      return { x, y };
    }

    // --- DEFINE GROUPS (order of append matters for z-index) ---
    // Links group will be appended first, so it's "behind" nodes.
    const linkContainerGroup = svg.append('g').attr('class', 'links');
    // Nodes group will be appended second, so it's "on top" of links.
    const nodeContainerGroup = svg.append('g').attr('class', 'nodes');

    // --- Draw Links SECOND --- so they appear on top of nodes
    const linkElements = linkContainerGroup.selectAll('g')
      .data(links)
      .join('g')
      .attr('id', d => `link-group-${d.id}`);

    linkElements.append('path')
      .attr('id', d => d.id)
      .attr('d', d => {
        const sourceNode = allNodes.find(n => n.id === d.source);
        const targetNode = allNodes.find(n => n.id === d.target);
        if (!sourceNode || !targetNode) return null;

        const startPt = { x: sourceNode.x + sourceNode.width / 2, y: sourceNode.y + sourceNode.height / 2 };
        const targetCenterPt = { x: targetNode.x + targetNode.width / 2, y: targetNode.y + targetNode.height / 2 };
        const ctrlPt = d.controlPoints;

        const dx = targetCenterPt.x - ctrlPt.x1;
        const dy = targetCenterPt.y - ctrlPt.y1;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let endPtX = targetCenterPt.x;
        let endPtY = targetCenterPt.y;

        if (dist > pullBackOffset) {
            // Pull back along the vector from control point to target center
            const ratio = (dist - pullBackOffset) / dist;
            endPtX = ctrlPt.x1 + dx * ratio;
            endPtY = ctrlPt.y1 + dy * ratio;
        } else if (dist > 0) { 
            const verySmallRatio = 0.1; // If control point is very close, aim slightly towards target
            endPtX = ctrlPt.x1 + dx * verySmallRatio;
            endPtY = ctrlPt.y1 + dy * verySmallRatio;
        } 
        // If dist is 0 (control point is target center), path will be a point. Arrow won't show well.

        return `M ${startPt.x} ${startPt.y} Q ${ctrlPt.x1} ${ctrlPt.y1} ${endPtX} ${endPtY}`;
      })
      .attr('fill', 'none')
      .attr('stroke', d => d.aiIntervention ? '#28a745' : '#555')
      .attr('stroke-width', d => d.aiIntervention ? 2.0 : 1.2) // Slightly thinner lines
      .attr('marker-end', d => d.aiIntervention ? 'url(#arrowhead-ai)' : 'url(#arrowhead-default)')
      .style('transition', 'opacity 0.3s, stroke 0.3s, stroke-width 0.3s');

    linkElements.each(function(d) {
      const sourceNode = allNodes.find(n => n.id === d.source);
      const targetNode = allNodes.find(n => n.id === d.target);
      if (!sourceNode || !targetNode) return;

      const startPt = { x: sourceNode.x + sourceNode.width / 2, y: sourceNode.y + sourceNode.height / 2 };
      const targetCenterPt = { x: targetNode.x + targetNode.width / 2, y: targetNode.y + targetNode.height / 2 };
      const ctrlPt = d.controlPoints;
      const dxLink = targetCenterPt.x - ctrlPt.x1;
      const dyLink = targetCenterPt.y - ctrlPt.y1;
      const distLink = Math.sqrt(dxLink * dxLink + dyLink * dyLink);
      let endPtForLabelX = targetCenterPt.x;
      let endPtForLabelY = targetCenterPt.y;
      if (distLink > pullBackOffset) {
        const ratio = (distLink - pullBackOffset) / distLink;
        endPtForLabelX = ctrlPt.x1 + dxLink * ratio;
        endPtForLabelY = ctrlPt.y1 + dyLink * ratio;
      } else if (distLink > 0) {
        const verySmallRatio = 0.1;
        endPtForLabelX = ctrlPt.x1 + dxLink * verySmallRatio;
        endPtForLabelY = ctrlPt.y1 + dyLink * verySmallRatio;
      }
      const actualEndPt = {x: endPtForLabelX, y: endPtForLabelY};

      const labelPos = getQuadraticBezierXYatT(startPt, d.controlPoints, actualEndPt, 0.5);
      const labelDx = d.labelOffset?.dx || 0;
      const labelDy = d.labelOffset?.dy || -8;
      const isAI = d.aiIntervention !== null;

      if (d.label) {
        // Add a subtle background for the label
        const labelGroup = d3.select(this).append('g')
          .attr('id', `label-group-${d.id}`);
          
        // Add background rect
        labelGroup.append('rect')
          .attr('id', `label-bg-${d.id}`)
          .attr('x', labelPos.x + labelDx - 25) // Will be adjusted after text length is known
          .attr('y', labelPos.y + labelDy - 10)
          .attr('width', 50) // Placeholder, will be adjusted
          .attr('height', 15)
          .attr('rx', 4)
          .attr('fill', '#f8f9fa')
          .attr('fill-opacity', 0.85)
          .attr('stroke', 'none');
        
        // Add the text on top of the background
        const textElement = labelGroup.append('text')
          .attr('id', `label-${d.id}`)
          .attr('x', labelPos.x + labelDx)
          .attr('y', labelPos.y + labelDy)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', isAI ? '#28a745' : '#333')
          .attr('font-weight', isAI ? 'bold' : 'normal')
          .style('transition', 'opacity 0.3s, fill 0.3s, font-weight 0.3s')
          .text(d.label);
          
        // Adjust the background rectangle to match the text width
        const textNode = textElement.node();
        if (textNode) {
          const textWidth = textNode.getBBox().width;
          labelGroup.select(`#label-bg-${d.id}`)
            .attr('x', labelPos.x + labelDx - (textWidth / 2) - 5)
            .attr('width', textWidth + 10);
        }
      }
      
      if (isAI) {
        d3.select(this).append('circle')
          .attr('id', `aicircle-${d.id}`)
          .attr('cx', labelPos.x + labelDx).attr('cy', labelPos.y + labelDy + 15)
          .attr('r', 3).attr('fill', '#28a745')
          .style('transition', 'opacity 0.3s, fill 0.3s');
      }
    });

    // --- Draw Nodes FIRST --- so links appear on top
    const nodeElements = nodeContainerGroup.selectAll('g')
      .data(allNodes)
      .join('g')
      .attr('id', d => `node-${d.id}`)
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .style('transition', 'opacity 0.3s');

    const nodeColors: {[key: string]: string} = {
      stock: '#e3f2fd', 
      informal: '#fff9c4', 
      formal: '#ffecb3',
      level0: '#c8e6c9',
      level1: '#b3e5fc', 
      level2: '#b2ebf2', 
      level3: '#d1c4e9', 
      outcome: '#ffccbc',
      queue: '#ffcdd2'
    };

    nodeElements.append('rect')
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('rx', 6).attr('ry', 6)
      .attr('fill', d => nodeColors[d.type] || '#f5f5f5')
      .attr('stroke', '#555')
      .attr('stroke-width', 1)
      .style('transition', 'stroke 0.3s, stroke-width 0.3s');

    nodeElements.append('text')
      .attr('x', d => d.width / 2)
      .attr('y', d => d.height / 2 - (d.description ? 3 : 0))
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-size', '14px').attr('font-weight', '600').attr('fill', '#333')
      .text(d => d.name);

    nodeElements.filter(d => !!d.description).append('text')
      .attr('x', d => d.width / 2)
      .attr('y', d => d.height / 2 + 12)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-size', '10px').attr('fill', '#555')
      .text(d => d.description || '');

    // --- Interactivity --- 
    const highlightColor = '#007bff';
    const fadedOpacity = 0.15;

    nodeElements.on('mouseover', function(event, hoveredNode) {
      nodeElements.style('opacity', d => d.id === hoveredNode.id ? 1 : fadedOpacity);
      d3.select(this).select('rect').attr('stroke', highlightColor).attr('stroke-width', 2.5);

      linkElements.each(function(linkData) {
        const isConnected = linkData.source === hoveredNode.id || linkData.target === hoveredNode.id;
        const linkGroup = d3.select(this);
        
        linkGroup.select('path')
          .style('opacity', isConnected ? 1 : fadedOpacity)
          .attr('stroke', isConnected ? highlightColor : (linkData.aiIntervention ? '#28a745' : '#555'))
          .attr('stroke-width', isConnected ? 2.5 : (linkData.aiIntervention ? 2.0 : 1.2)) // Highlighted links thicker
          .attr('marker-end', isConnected ? 'url(#arrowhead-highlight)' : (linkData.aiIntervention ? 'url(#arrowhead-ai)' : 'url(#arrowhead-default)'));

        // Update label group
        linkGroup.select(`#label-group-${linkData.id}`)
          .style('opacity', isConnected ? 1 : fadedOpacity);
          
        linkGroup.select(`#label-${linkData.id}`)
          .attr('fill', isConnected ? highlightColor : (linkData.aiIntervention ? '#28a745' : '#333'))
          .attr('font-weight', isConnected ? 'bold' : (linkData.aiIntervention ? 'bold' : 'normal'));
        
        linkGroup.select(`#aicircle-${linkData.id}`)
          .style('opacity', isConnected ? 1 : fadedOpacity)
          .attr('fill', isConnected ? highlightColor : '#28a745');
      });
    });

    nodeElements.on('mouseout', function() {
      nodeElements.style('opacity', 1);
      nodeElements.select('rect').attr('stroke', '#555').attr('stroke-width', 1);

      linkElements.each(function(linkData) {
        const linkGroup = d3.select(this);
        linkGroup.select('path')
          .style('opacity', 1)
          .attr('stroke', linkData.aiIntervention ? '#28a745' : '#555')
          .attr('stroke-width', linkData.aiIntervention ? 2.0 : 1.2)
          .attr('marker-end', linkData.aiIntervention ? 'url(#arrowhead-ai)' : 'url(#arrowhead-default)');

        // Reset label group
        linkGroup.select(`#label-group-${linkData.id}`)
          .style('opacity', 1);
          
        linkGroup.select(`#label-${linkData.id}`)
          .attr('fill', linkData.aiIntervention ? '#28a745' : '#333')
          .attr('font-weight', linkData.aiIntervention ? 'bold' : 'normal');

        linkGroup.select(`#aicircle-${linkData.id}`)
          .style('opacity', 1)
          .attr('fill', '#28a745');
      });
    });
    
    // --- Legend --- 
    if (Object.values(aiInterventions).some(v => v) || congestion > 0) {
        const legendWidth = 200;
        const legendX = svgWidth - legendWidth - 20;
        const legendY = 20;
        const legend = svg.append('g')
          .attr('transform', `translate(${legendX}, ${legendY})`);
  
        const activeInterventionTypes = [
          { id: 'triageAI', name: 'Health Advisor', active: aiInterventions.triageAI },
          { id: 'chwAI', name: 'CHW AI', active: aiInterventions.chwAI },
          { id: 'diagnosticAI', name: 'Diagnostic AI (L1/L2)', active: aiInterventions.diagnosticAI },
          { id: 'bedManagementAI', name: 'Bed Mgmt AI', active: aiInterventions.bedManagementAI },
          { id: 'hospitalDecisionAI', name: 'Hospital Decision AI', active: aiInterventions.hospitalDecisionAI },
          { id: 'selfCareAI', name: 'Self-Care Platform', active: aiInterventions.selfCareAI }
        ].filter(i => i.active);
        
        // Add congestion effects to legend
        const congestionEffects = [];
        if (congestion > 0) {
          congestionEffects.push({ id: 'congestion', name: `Congestion: ${(congestion * 100).toFixed(0)}%`, type: 'header' });
          congestionEffects.push({ id: 'capacity', name: `Capacity: ${(capacityMultiplier * 100).toFixed(0)}%`, type: 'effect' });
          if (congestion > 0.5) {
            congestionEffects.push({ id: 'muBoost', name: `Staff boost: +${((muBoost - 1) * 100).toFixed(0)}%`, type: 'effect' });
            congestionEffects.push({ id: 'rhoReduction', name: `Referral reduction: -${((1 - rhoReduction) * 100).toFixed(0)}%`, type: 'effect' });
            congestionEffects.push({ id: 'arrivalReduction', name: `Arrival reduction: -${((1 - arrivalMultiplier) * 100).toFixed(0)}%`, type: 'effect' });
          }
        }
  
        const legendItemHeight = 20;
        const legendPadding = 10;
        const totalItems = activeInterventionTypes.length + congestionEffects.length + (congestionEffects.length > 0 ? 1 : 0);
        const legendHeight = totalItems * legendItemHeight + 2 * legendPadding + 20;
  
        legend.append('rect')
          .attr('width', legendWidth)
          .attr('height', legendHeight)
          .attr('fill', 'rgba(255,255,255,0.9)')
          .attr('stroke', '#ccc')
          .attr('rx', 5).attr('ry', 5);
  
        legend.append('text')
          .attr('x', legendPadding)
          .attr('y', legendPadding + 5)
          .attr('font-weight', 'bold')
          .attr('font-size', '12px')
          .attr('fill', '#333')
          .text(activeInterventionTypes.length > 0 ? 'Active AI Interventions' : 'System Status');
  
        activeInterventionTypes.forEach((intervention, i) => {
          const itemY = legendPadding + 25 + (i * legendItemHeight);
          legend.append('circle')
            .attr('cx', legendPadding + 7)
            .attr('cy', itemY)
            .attr('r', 5)
            .attr('fill', '#28a745');
          legend.append('text')
            .attr('x', legendPadding + 20)
            .attr('y', itemY)
            .attr('font-size', '11px')
            .attr('fill', '#333')
            .attr('dominant-baseline', 'middle')
            .text(intervention.name);
        });
        
        // Add congestion effects
        if (congestionEffects.length > 0) {
          let yOffset = legendPadding + 25 + (activeInterventionTypes.length * legendItemHeight);
          
          // Add separator if there are AI interventions
          if (activeInterventionTypes.length > 0) {
            yOffset += 10;
            legend.append('line')
              .attr('x1', legendPadding)
              .attr('x2', legendWidth - legendPadding)
              .attr('y1', yOffset - 5)
              .attr('y2', yOffset - 5)
              .attr('stroke', '#ddd')
              .attr('stroke-width', 1);
          }
          
          congestionEffects.forEach((effect, i) => {
            const itemY = yOffset + (i * legendItemHeight);
            
            if (effect.type === 'header') {
              legend.append('text')
                .attr('x', legendPadding)
                .attr('y', itemY)
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .attr('fill', '#e76f51')
                .attr('dominant-baseline', 'middle')
                .text(effect.name);
            } else {
              legend.append('text')
                .attr('x', legendPadding + 15)
                .attr('y', itemY)
                .attr('font-size', '11px')
                .attr('fill', '#666')
                .attr('dominant-baseline', 'middle')
                .text(`• ${effect.name}`);
            }
          });
        }
      }
  }, [params, population, aiInterventions, activeMultipliers, derivedParams, baseParams]);

  return (
    <div className="flex justify-center mb-4 w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden p-2 shadow-sm w-full max-w-4xl mx-auto">
        {isMultiDiseaseMode && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Disease for Diagram:
            </label>
            <select
              value={effectiveSelectedDisease}
              onChange={(e) => effectiveOnDiseaseChange(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {selectedDiseases.map((disease) => (
                <option key={disease} value={disease}>
                  {disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              The diagram shows parameters specific to the selected disease.
              {effectiveSelectedDisease && ` Current deltaU (untreated mortality): ${(params.deltaU * 100).toFixed(2)}% per week`}
            </p>
          </div>
        )}
        <svg ref={svgRef} style={{ width: '100%', height: 'auto' }} />
      </div>
    </div>
  );
};

export default StockFlowDiagram; 