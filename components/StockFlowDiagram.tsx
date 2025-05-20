import React, { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { 
  baseParametersAtom,
  derivedParametersAtom, 
  populationSizeAtom, 
  aiInterventionsAtom,
  healthSystemMultipliersAtom,
  HealthSystemMultipliers
} from '../lib/store';
import * as d3 from 'd3';

interface Node {
  id: string;
  name: string;
  description: string;
  type: 'stock' | 'informal' | 'formal' | 'level0' | 'level1' | 'level2' | 'level3' | 'outcome';
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

const StockFlowDiagram: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [baseParams] = useAtom(baseParametersAtom);
  const [derivedParams] = useAtom(derivedParametersAtom);
  const [population] = useAtom(populationSizeAtom);
  const [aiInterventions] = useAtom(aiInterventionsAtom);
  const [activeMultipliers] = useAtom(healthSystemMultipliersAtom);

  // Use the most current parameters, preferring base params for user-edited values
  const params = baseParams;
  
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
      { id: 'l0', name: 'CHW (L0)', description: 'Community Health Workers', type: 'level0', x: 550, y: 100, width: nodeWidth, height: nodeHeight },
      { id: 'l1', name: 'Primary (L1)', description: 'Primary Care Facilities', type: 'level1', x: 550, y: 250, width: nodeWidth, height: nodeHeight },
      { id: 'l2', name: 'District (L2)', description: 'District Hospitals', type: 'level2', x: 550, y: 400, width: nodeWidth, height: nodeHeight },
      { id: 'l3', name: 'Tertiary (L3)', description: 'Tertiary Hospitals', type: 'level3', x: 550, y: 550, width: nodeWidth, height: nodeHeight },
      { id: 'resolved', name: 'Resolved', description: 'Cases resolved', type: 'outcome', x: 950, y: 200, width: nodeWidth, height: nodeHeight },
      { id: 'deaths', name: 'Deaths', description: 'Deaths from all causes', type: 'outcome', x: 950, y: 450, width: nodeWidth, height: nodeHeight },
    ];

    const fmt = (num: number) => num < 0.01 && num !== 0 ? num.toFixed(4) : num < 0.1 && num !== 0 ? num.toFixed(3) : num.toFixed(2);

    const links: Link[] = [
      // From New Cases
      { id: 'link_new_untreated', source: 'new', target: 'untreated', label: `(1-${getUnicodeBaseSymbol('phi', '0')})r: ${fmt((1 - params.phi0) * params.informalCareRatio)}`, value: (1 - params.phi0) * params.informalCareRatio * weeklyIncidence, aiIntervention: null, parameter: null, controlPoints: { x1: 150, y1: 475 }, labelOffset: {dy: -15} },
      { id: 'link_new_informal', source: 'new', target: 'informal', label: `(1-${getUnicodeBaseSymbol('phi', '0')})(1-r): ${fmt((1 - params.phi0) * (1 - params.informalCareRatio))}`, value: (1 - params.phi0) * (1 - params.informalCareRatio) * weeklyIncidence, aiIntervention: null, parameter: null, controlPoints: { x1: 150, y1: 325 } },
      { id: 'link_new_formal', source: 'new', target: 'formal', label: `${getUnicodeBaseSymbol('phi', '0')}: ${fmt(params.phi0)}`, value: params.phi0 * weeklyIncidence, aiIntervention: aiInterventions.triageAI ? 'triageAI' : null, parameter: 'phi0', controlPoints: { x1: 150, y1: 175 }, labelOffset: {dy: -15} },
      
      // From Untreated to Deaths
      { id: 'link_untreated_deaths', source: 'untreated', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', 'U')}: ${fmt(params.deltaU)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 600, y1: 500 }, labelOffset: {dx: 30, dy: 15} },
      
      // From Informal Care
      { id: 'link_informal_formal', source: 'informal', target: 'formal', label: `${getUnicodeBaseSymbol('sigma', 'I')}: ${fmt(params.sigmaI)}`, value: null, aiIntervention: aiInterventions.triageAI ? 'triageAI' : null, parameter: 'sigmaI', controlPoints: { x1: 250, y1: 225 }, labelOffset: {dx: -20} },
      { id: 'link_informal_resolved', source: 'informal', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', 'I')}: ${fmt(params.muI)}`, value: null, aiIntervention: aiInterventions.selfCareAI ? 'selfCareAI' : null, parameter: 'muI', controlPoints: { x1: 600, y1: 225 }, labelOffset: {dy: -20} },
      { id: 'link_informal_deaths', source: 'informal', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', 'I')}: ${fmt(params.deltaI)}`, value: null, aiIntervention: aiInterventions.selfCareAI ? 'selfCareAI' : null, parameter: 'deltaI', controlPoints: { x1: 600, y1: 375 }, labelOffset: {dy: 20} },
      
      // From Formal Care to L0 only
      { id: 'link_formal_l0', source: 'formal', target: 'l0', label: `(to L0): ${fmt(1.0)}`, value: null, aiIntervention: aiInterventions.triageAI ? 'triageAI' : null, parameter: null, controlPoints: { x1: 400, y1: 125 }, labelOffset: {dy: -10} },
      
      // From L0 (CHW)
      { id: 'link_l0_l1', source: 'l0', target: 'l1', label: `${getUnicodeBaseSymbol('rho', '0')}: ${fmt(params.rho0)}`, value: null, aiIntervention: aiInterventions.chwAI ? 'chwAI' : null, parameter: 'rho0', controlPoints: { x1: 550, y1: 175 }, labelOffset: {dx: -25} },
      { id: 'link_l0_resolved', source: 'l0', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', '0')}: ${fmt(params.mu0)}`, value: null, aiIntervention: aiInterventions.chwAI ? 'chwAI' : null, parameter: 'mu0', controlPoints: { x1: 750, y1: 150 }, labelOffset: {dy: -15} },
      { id: 'link_l0_deaths', source: 'l0', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', '0')}: ${fmt(params.delta0)}`, value: null, aiIntervention: aiInterventions.chwAI ? 'chwAI' : null, parameter: 'delta0', controlPoints: { x1: 750, y1: 300 }, labelOffset: {dy: 25, dx: 20} },
      
      // From L1 (Primary)
      { id: 'link_l1_l2', source: 'l1', target: 'l2', label: `${getUnicodeBaseSymbol('rho', '1')}: ${fmt(params.rho1)}`, value: null, aiIntervention: aiInterventions.diagnosticAI ? 'diagnosticAI' : null, parameter: 'rho1', controlPoints: { x1: 550, y1: 325 }, labelOffset: {dx: -25} },
      { id: 'link_l1_resolved', source: 'l1', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', '1')}: ${fmt(params.mu1)}`, value: null, aiIntervention: aiInterventions.diagnosticAI ? 'diagnosticAI' : null, parameter: 'mu1', controlPoints: { x1: 750, y1: 225 }, labelOffset: {dy: -15} },
      { id: 'link_l1_deaths', source: 'l1', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', '1')}: ${fmt(params.delta1)}`, value: null, aiIntervention: aiInterventions.diagnosticAI ? 'diagnosticAI' : null, parameter: 'delta1', controlPoints: { x1: 750, y1: 350 }, labelOffset: {dy: 20} },
      
      // From L2 (District)
      { id: 'link_l2_l3', source: 'l2', target: 'l3', label: `${getUnicodeBaseSymbol('rho', '2')}: ${fmt(params.rho2)}`, value: null, aiIntervention: null, parameter: null, controlPoints: { x1: 550, y1: 475 }, labelOffset: {dx: -25} },
      { id: 'link_l2_resolved', source: 'l2', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', '2')}: ${fmt(params.mu2)}`, value: null, aiIntervention: aiInterventions.bedManagementAI ? 'bedManagementAI' : null, parameter: 'mu2', controlPoints: { x1: 750, y1: 325 }, labelOffset: {dy: -20} },
      { id: 'link_l2_deaths', source: 'l2', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', '2')}: ${fmt(params.delta2)}`, value: null, aiIntervention: aiInterventions.hospitalDecisionAI ? 'hospitalDecisionAI' : null, parameter: 'delta2', controlPoints: { x1: 750, y1: 425 }, labelOffset: {dy: 20} },
      
      // From L3 (Tertiary)
      { id: 'link_l3_resolved', source: 'l3', target: 'resolved', label: `${getUnicodeBaseSymbol('mu', '3')}: ${fmt(params.mu3)}`, value: null, aiIntervention: aiInterventions.bedManagementAI ? 'bedManagementAI' : null, parameter: 'mu3', controlPoints: { x1: 750, y1: 375 }, labelOffset: {dy: -20, dx: -15} },
      { id: 'link_l3_deaths', source: 'l3', target: 'deaths', label: `${getUnicodeBaseSymbol('delta', '3')}: ${fmt(params.delta3)}`, value: null, aiIntervention: aiInterventions.hospitalDecisionAI ? 'hospitalDecisionAI' : null, parameter: 'delta3', controlPoints: { x1: 750, y1: 500 }, labelOffset: {dy: 15} },
    ];

    const svgWidth = 1100;
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
        const sourceNode = nodes.find(n => n.id === d.source);
        const targetNode = nodes.find(n => n.id === d.target);
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
      const sourceNode = nodes.find(n => n.id === d.source);
      const targetNode = nodes.find(n => n.id === d.target);
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
      .data(nodes)
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
      outcome: '#ffccbc'
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
    if (Object.values(aiInterventions).some(v => v)) {
        const legendWidth = 200;
        const legendX = svgWidth - legendWidth - 20;
        const legendY = 20;
        const legend = svg.append('g')
          .attr('transform', `translate(${legendX}, ${legendY})`);
  
        const activeInterventionTypes = [
          { id: 'triageAI', name: 'Triage AI', active: aiInterventions.triageAI },
          { id: 'chwAI', name: 'CHW AI', active: aiInterventions.chwAI },
          { id: 'diagnosticAI', name: 'Diagnostic AI', active: aiInterventions.diagnosticAI },
          { id: 'bedManagementAI', name: 'Bed Mgmt AI', active: aiInterventions.bedManagementAI },
          { id: 'hospitalDecisionAI', name: 'Hospital Decision AI', active: aiInterventions.hospitalDecisionAI },
          { id: 'selfCareAI', name: 'Self-Care AI', active: aiInterventions.selfCareAI }
        ].filter(i => i.active);
  
        const legendItemHeight = 20;
        const legendPadding = 10;
        const legendHeight = activeInterventionTypes.length * legendItemHeight + 2 * legendPadding + 20;
  
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
          .text('Active AI Interventions');
  
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
      }
  }, [params, population, aiInterventions, activeMultipliers]);

  return (
    <div className="flex justify-center mb-4 w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden p-2 shadow-sm w-full max-w-4xl mx-auto">
        <svg ref={svgRef} style={{ width: '100%', height: 'auto' }} />
      </div>
    </div>
  );
};

export default StockFlowDiagram; 