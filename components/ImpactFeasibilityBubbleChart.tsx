import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { scenariosAtom, Scenario, updateScenarioAtom, aiTimeToScaleParametersAtom } from '../lib/store';
import { formatNumber, estimateTimeToScale } from '../lib/utils';
import * as d3 from 'd3';
import { baselineResultsMapAtom, getEnhancedBaselineKey, multiDiseaseScenarioModeAtom } from '../lib/store';

// Helper function to get country-specific baseline
const getCountrySpecificBaseline = (
  baselineMap: Record<string, Record<string, any>>, 
  disease: string, 
  scenario: any,
  scenarioMode: string
) => {
  // PRIORITY 1: Use scenario's own stored baseline if available
  // This ensures scenarios created by "Test Each AI" maintain their original baselines
  if (scenario.baselineResults) {
    console.log('ImpactFeasibility using scenario stored baseline:', {
      scenarioName: scenario.name,
      hasBaseline: true
    });
    return scenario.baselineResults;
  }
  
  const countryCode = scenario.countryCode;
  const isUrban = scenario.isUrban;
  const congestion = scenario.parameters?.systemCongestion || 0;
  const selectedDiseases = scenario.selectedDiseases || [scenario.parameters?.disease || disease];
  
  // Try enhanced baseline key first (includes congestion)
  if (countryCode && isUrban !== undefined) {
    const enhancedKey = getEnhancedBaselineKey(countryCode, isUrban, selectedDiseases, congestion, scenarioMode);
    console.log('ImpactFeasibility baseline lookup:', {
      scenarioName: scenario.name,
      enhancedKey,
      congestion,
      foundBaseline: !!(baselineMap[enhancedKey] && baselineMap[enhancedKey][disease])
    });
    if (baselineMap[enhancedKey] && baselineMap[enhancedKey][disease]) {
      return baselineMap[enhancedKey][disease];
    }
  }
  
  // Try generic enhanced key
  const genericEnhancedKey = `generic_${selectedDiseases.sort().join('-')}_cong${Math.round(congestion * 100)}_${scenarioMode}`;
  if (baselineMap[genericEnhancedKey] && baselineMap[genericEnhancedKey][disease]) {
    return baselineMap[genericEnhancedKey][disease];
  }
  
  // Fall back to simple keys for backward compatibility
  if (countryCode && isUrban !== undefined) {
    const simpleKey = `${countryCode}_${isUrban ? 'urban' : 'rural'}`;
    if (baselineMap[simpleKey] && baselineMap[simpleKey][disease]) {
      return baselineMap[simpleKey][disease];
    }
  }
  
  if (baselineMap['generic'] && baselineMap['generic'][disease]) {
    return baselineMap['generic'][disease];
  }
  
  // If no baseline found, log warning
  console.log('ImpactFeasibility no baseline found:', {
    scenarioName: scenario.name,
    availableKeys: Object.keys(baselineMap)
  });
  return null;
};

interface ImpactFeasibilityData {
  scenario: Scenario;
  impact: number; // DALYs averted per 1000 population or % deaths averted
  timeToScale: number; // 0-1 where 0 is immediate, 1 is long-term
  populationImpact: number; // Total DALYs averted
  percentDeathsAverted: number; // Percentage of deaths averted
  quadrant: 'big-bets' | 'moonshots' | 'quick-wins' | 'incremental';
}

// Helper function to get display names for quadrants
const getQuadrantDisplayName = (quadrant: ImpactFeasibilityData['quadrant']): string => {
  switch (quadrant) {
    case 'big-bets': return 'Big Bets';
    case 'moonshots': return 'Moonshots';
    case 'quick-wins': return 'Quick Wins';
    case 'incremental': return 'Incremental';
    default: return quadrant;
  }
};

const ImpactFeasibilityBubbleChart: React.FC = () => {
  const [scenarios] = useAtom(scenariosAtom);
  const [baselineMap] = useAtom(baselineResultsMapAtom);
  const [timeToScaleParams] = useAtom(aiTimeToScaleParametersAtom);
  const [scenarioMode] = useAtom(multiDiseaseScenarioModeAtom);
  const [yAxisMetric, setYAxisMetric] = useState<'dalys' | 'percent-deaths'>('percent-deaths');
  const [selectedDiseases, setSelectedDiseases] = useState<Set<string>>(new Set());
  const [availableDiseases, setAvailableDiseases] = useState<string[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const [colorBy, setColorBy] = useState<'quadrant' | 'country' | 'disease'>('quadrant');
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Create stable color scales outside of the effect
  const countryColorScale = d3.scaleOrdinal<string>()
    .domain(availableCountries.sort())
    .range(d3.schemeSet3);
  
  const diseaseColorScale = d3.scaleOrdinal<string>()
    .domain(availableDiseases.sort())
    .range(d3.schemeCategory10);

  // Initialize disease and country filters
  useEffect(() => {
    const diseaseSet = new Set<string>();
    const countrySet = new Set<string>();
    
    scenarios.forEach(scenario => {
      // Only add diseases from scenarios that have results
      if (scenario.results) {
        const disease = scenario.parameters.disease || 'Unknown';
        diseaseSet.add(disease);
      }
      
      const country = scenario.countryName || 'Generic';
      countrySet.add(country);
    });
    
    const diseaseList = Array.from(diseaseSet).sort();
    setAvailableDiseases(diseaseList);
    
    const countryList = Array.from(countrySet).sort();
    setAvailableCountries(countryList);
    
    // Initialize selections to include all if empty
    if (selectedDiseases.size === 0 && diseaseList.length > 0) {
      setSelectedDiseases(new Set(diseaseList));
      console.log('Impact vs Feasibility Chart: Initialized disease selection with:', diseaseList);
    }
    
    // Update country selection to include any new countries
    if (countryList.length > selectedCountries.size) {
      // Check if there are new countries not in the current selection
      const newCountries = countryList.filter(country => !selectedCountries.has(country));
      if (newCountries.length > 0) {
        // Add new countries to the selection
        setSelectedCountries(new Set([...selectedCountries, ...countryList]));
        console.log('Impact vs Feasibility Chart: Added new countries to selection:', newCountries);
      }
    } else if (selectedCountries.size === 0 && countryList.length > 0) {
      // Initialize if empty
      setSelectedCountries(new Set(countryList));
      console.log('Impact vs Feasibility Chart: Initialized country selection with:', countryList);
    }
  }, [scenarios]);


  // Calculate impact metrics for each scenario
  const calculateImpactData = (scenario: Scenario): ImpactFeasibilityData | null => {
    if (!scenario.results) return null;
    
    const disease = scenario.parameters.disease || 'Unknown';
    
    // Use enhanced baseline lookup with congestion
    let diseaseBaseline = getCountrySpecificBaseline(
      baselineMap, 
      disease, 
      scenario,
      scenarioMode
    );
    
    if (!diseaseBaseline) return null;
    
    // Calculate DALYs averted
    const dalysAverted = diseaseBaseline.dalys - scenario.results.dalys;
    const population = scenario.parameters.population || 1000000;
    
    // Impact per 1000 population
    const impactPer1000 = (dalysAverted / population) * 1000;
    
    // Calculate percentage of deaths averted
    const deathsAverted = diseaseBaseline.cumulativeDeaths - scenario.results.cumulativeDeaths;
    const percentDeathsAverted = diseaseBaseline.cumulativeDeaths > 0 
      ? (deathsAverted / diseaseBaseline.cumulativeDeaths) * 100 
      : 0;
    
    // Time to scale - use scenario's timeToScaleParams if available, otherwise use current params
    const timeToScale = scenario.timeToScaleParams 
      ? estimateTimeToScale(scenario.aiInterventions, scenario.timeToScaleParams)
      : estimateTimeToScale(scenario.aiInterventions, timeToScaleParams);
    
    // Determine impact value based on selected metric
    const impactValue = yAxisMetric === 'dalys' ? impactPer1000 : percentDeathsAverted;
    
    // Determine bubble size based on selected metric
    // When showing %, use absolute numbers; when showing per capita, use totals
    // Ensure we never have negative bubble sizes by taking absolute value and adding a minimum
    const rawPopulationImpact = yAxisMetric === 'dalys' ? dalysAverted : deathsAverted;
    const populationImpact = Math.max(Math.abs(rawPopulationImpact), 1); // Minimum size of 1
    
    // Determine quadrant based on impact and time to scale
    const quadrant = determineQuadrant(impactValue, timeToScale, yAxisMetric);
    
    return {
      scenario,
      impact: impactValue,
      timeToScale,
      populationImpact,
      percentDeathsAverted,
      quadrant
    };
  };

  // Determine which quadrant a scenario falls into
  const determineQuadrant = (impact: number, timeToScale: number, metric: 'dalys' | 'percent-deaths'): ImpactFeasibilityData['quadrant'] => {
    const impactThreshold = metric === 'dalys' ? 100 : 10; // 100 DALYs per 1000 or 10% deaths averted
    const timeThreshold = 0.5; // 0-1 scale
    
    if (impact >= impactThreshold && timeToScale >= timeThreshold) {
      return 'big-bets'; // High impact, quick to implement
    } else if (impact >= impactThreshold && timeToScale < timeThreshold) {
      return 'moonshots'; // High impact, takes time
    } else if (impact < impactThreshold && timeToScale >= timeThreshold) {
      return 'quick-wins'; // Low impact, quick to implement
    } else {
      return 'incremental'; // Low impact, takes time
    }
  };

  // Handle disease filter toggle
  const toggleDiseaseFilter = (disease: string) => {
    const newSelectedDiseases = new Set(selectedDiseases);
    
    if (newSelectedDiseases.has(disease)) {
      if (newSelectedDiseases.size > 1) {
        newSelectedDiseases.delete(disease);
      }
    } else {
      newSelectedDiseases.add(disease);
    }
    
    console.log('Impact vs Feasibility Chart: Disease filter changed to:', Array.from(newSelectedDiseases));
    setSelectedDiseases(newSelectedDiseases);
  };

  // Select all diseases
  const selectAllDiseases = () => {
    setSelectedDiseases(new Set(availableDiseases));
  };

  // Clear all diseases (keep at least one selected)
  const clearAllDiseases = () => {
    if (availableDiseases.length > 0) {
      setSelectedDiseases(new Set([availableDiseases[0]]));
    }
  };

  // Handle country filter toggle
  const toggleCountryFilter = (country: string) => {
    const newSelectedCountries = new Set(selectedCountries);
    
    if (newSelectedCountries.has(country)) {
      if (newSelectedCountries.size > 1) {
        newSelectedCountries.delete(country);
      }
    } else {
      newSelectedCountries.add(country);
    }
    
    setSelectedCountries(newSelectedCountries);
  };

  // Select all countries
  const selectAllCountries = () => {
    setSelectedCountries(new Set(availableCountries));
  };

  // Clear all countries (keep at least one selected)
  const clearAllCountries = () => {
    if (availableCountries.length > 0) {
      setSelectedCountries(new Set([availableCountries[0]]));
    }
  };

  // Create the visualization
  useEffect(() => {
    if (!chartRef.current || scenarios.length <= 1) return;

    const width = chartRef.current.clientWidth;
    const height = 600;
    const margin = { top: 40, right: 80, bottom: 80, left: 80 };
    
    // Get valid scenarios with impact data - be more inclusive for AI comparison scenarios
    const impactData = (() => {
      // Filter scenarios based on current selections - be more inclusive
      const filteredScenarios = scenarios.filter(s => {
        if (!s.results) return false;
        
        // Get the scenario's country (use 'Generic' if not specified)
        const scenarioCountry = s.countryName || 'Generic';
        
        // Country filtering - must match selected countries
        const countryMatch = selectedCountries.has(scenarioCountry);
        if (!countryMatch) {
          return false;
        }
        
        // Simple disease filtering - just check if the scenario's disease is selected
        const scenarioDisease = s.parameters.disease || 'Unknown';
        const diseaseMatch = selectedDiseases.has(scenarioDisease);
        
        console.log(`Impact/Feasibility Scenario "${s.name}": country=${scenarioCountry}, disease=${scenarioDisease}, included=${diseaseMatch}`);
        
        return diseaseMatch;
      });
      
      // Simple debug logging
      console.log(`Impact vs Feasibility: ${filteredScenarios.length} scenarios matched filters:`, filteredScenarios.map(s => s.name));
      
      return filteredScenarios.map(calculateImpactData).filter((d): d is ImpactFeasibilityData => d !== null);
    })();
    
    // Ensure we have data to display
    if (impactData.length === 0) {
      console.log('Impact vs Feasibility Chart: No impact data available for chart');
      return;
    }
    
    console.log(`Impact vs Feasibility Chart: Displaying ${impactData.length} scenarios`);
    
    const countriesInData = Array.from(new Set(impactData.map(d => d.scenario.countryName || 'Generic')));
    console.log(`Impact vs Feasibility: Rendering ${impactData.length} bubbles for countries: ${countriesInData.join(', ')}`);
    console.log('Scenario names:', impactData.map(d => d.scenario.name));

    // Clear previous chart
    d3.select(chartRef.current).selectAll("svg").remove();
    
    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Define scales
    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, innerWidth]);
    
    // For y-axis scaling, consider ALL scenarios (not just filtered ones)
    // This ensures new scenarios don't go out of bounds
    const allScenariosImpactData = scenarios
      .filter(s => s.results) // Only scenarios with results
      .map(calculateImpactData)
      .filter((d): d is ImpactFeasibilityData => d !== null);
    
    const allImpactValues = allScenariosImpactData.map(d => d.impact);
    const impactValues = impactData.map(d => d.impact);
    
    // Calculate min and max values based on ALL data (not just filtered)
    const dataMin = allImpactValues.length > 0 ? Math.min(...allImpactValues) : 
                    (impactValues.length > 0 ? Math.min(...impactValues) : 0);
    const dataMax = allImpactValues.length > 0 ? Math.max(...allImpactValues) : 
                    (impactValues.length > 0 ? Math.max(...impactValues) : 10);
    const impactThreshold = yAxisMetric === 'dalys' ? 100 : 10; // Thresholds for quadrants
    
    // Determine the y-axis bounds:
    // - Always include 0 to show the threshold line
    // - Handle negative values (scenarios worse than baseline)
    // - Ensure threshold is visible if data is near it
    let minImpact = Math.min(0, dataMin);
    let maxImpact;
    
    if (dataMax < impactThreshold * 0.5) {
      // Data is well below threshold - focus on the data range
      maxImpact = dataMax * 1.3; // 30% padding above max data point
    } else if (dataMax < impactThreshold * 1.5) {
      // Data is near threshold - show threshold clearly with more room
      maxImpact = Math.max(impactThreshold * 1.5, dataMax * 1.25); // Show threshold with 50% padding or 25% above data
    } else {
      // Data exceeds threshold significantly - scale to data with more breathing room
      maxImpact = dataMax * 1.2; // 20% padding for larger values
    }
    
    // Add padding for negative values
    if (minImpact < 0) {
      minImpact = minImpact * 1.1; // 10% padding for negative values
    }
    
    // Ensure minimum scale for very small values
    if (yAxisMetric === 'dalys' && maxImpact < 20) {
      maxImpact = 20;
    } else if (yAxisMetric === 'percent-deaths' && maxImpact < 5) {
      maxImpact = 5;
    }
    
    // For percent deaths, ensure we always have room above 10% threshold
    if (yAxisMetric === 'percent-deaths' && maxImpact < 15) {
      maxImpact = 15; // Always show up to 15% for better visualization
    }
    
    const yScale = d3.scaleLinear()
      .domain([minImpact, maxImpact])
      .range([innerHeight, 0]);
    
    // Size scale for bubbles - calculate based on actual deaths averted for consistency
    // This ensures bubble sizes are comparable across different views
    const maxDeathsAverted = Math.max(
      ...impactData.map(d => {
        if (!d.scenario.results || !d.scenario.baselineResults) return 1;
        const baseline = getCountrySpecificBaseline(
          baselineMap, 
          d.scenario.parameters.disease || 'Unknown', 
          d.scenario,
          scenarioMode
        );
        if (!baseline || baseline.cumulativeDeaths === undefined) return 1;
        return Math.abs(baseline.cumulativeDeaths - d.scenario.results.cumulativeDeaths);
      }),
      10 // Minimum scale
    );
    
    // Use sqrt scale for better visual differentiation
    const sizeScale = d3.scaleSqrt()
      .domain([0, maxDeathsAverted])
      .range([8, 50]); // Slightly larger minimum size for visibility
    
    // Color scale based on colorBy option
    const quadrantColorScale = d3.scaleOrdinal<string>()
      .domain(['big-bets', 'moonshots', 'quick-wins', 'incremental'])
      .range(['#2a9d8f', '#e9c46a', '#8ecae6', '#e76f51']);
    
    // Use the stable color scales defined at component level
    const chartCountryColorScale = d3.scaleOrdinal<string>()
      .domain(availableCountries.sort())
      .range(d3.schemeSet3);
    
    const chartDiseaseColorScale = d3.scaleOrdinal<string>()
      .domain(availableDiseases.sort())
      .range(d3.schemeCategory10);
    
    const getColor = (data: ImpactFeasibilityData) => {
      if (colorBy === 'quadrant') {
        return quadrantColorScale(data.quadrant);
      } else if (colorBy === 'country') {
        return chartCountryColorScale(data.scenario.countryName || 'Generic');
      } else {
        return chartDiseaseColorScale(data.scenario.parameters.disease || 'Unknown');
      }
    };
    
    // Calculate dynamic thresholds based on data
    // (impactThreshold already defined above)
    const timeThreshold = 0.5; // Same as in determineQuadrant
    
    // Convert thresholds to pixel positions
    const impactThresholdY = yScale(impactThreshold);
    const timeThresholdX = xScale(timeThreshold);
    
    // Add quadrant backgrounds with dynamic positioning
    const quadrantData = [
      { x: 0, y: impactThresholdY, width: timeThresholdX, height: innerHeight - impactThresholdY, quadrant: 'incremental', label: 'Incremental' },
      { x: timeThresholdX, y: impactThresholdY, width: innerWidth - timeThresholdX, height: innerHeight - impactThresholdY, quadrant: 'quick-wins', label: 'Quick Wins' },
      { x: 0, y: 0, width: timeThresholdX, height: impactThresholdY, quadrant: 'moonshots', label: 'Moonshots' },
      { x: timeThresholdX, y: 0, width: innerWidth - timeThresholdX, height: impactThresholdY, quadrant: 'big-bets', label: 'Big Bets' }
    ];
    
    svg.selectAll(".quadrant")
      .data(quadrantData)
      .enter()
      .append("rect")
      .attr("class", "quadrant")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("fill", d => quadrantColorScale(d.quadrant))
      .attr("opacity", 0.1);
    
    // Add threshold lines for clarity
    // Only show impact threshold line if it's within the visible range
    if (impactThreshold <= maxImpact) {
      svg.append("line")
        .attr("class", "threshold-line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", impactThresholdY)
        .attr("y2", impactThresholdY)
        .attr("stroke", "#666")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("opacity", 0.5);
      
      svg.append("text")
        .attr("x", 5)
        .attr("y", impactThresholdY - 5)
        .attr("font-size", "11px")
        .attr("fill", "#666")
        .text(yAxisMetric === 'dalys' ? "100 DALYs/1000" : "10% deaths");
    }
    
    svg.append("line")
      .attr("class", "threshold-line")
      .attr("x1", timeThresholdX)
      .attr("x2", timeThresholdX)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#666")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("opacity", 0.5);
    
    // Add threshold labels
    svg.append("text")
      .attr("x", timeThresholdX + 5)
      .attr("y", innerHeight - 5)
      .attr("font-size", "11px")
      .attr("fill", "#666")
      .text("1 year");
    
    // Add quadrant labels
    svg.selectAll(".quadrant-label")
      .data(quadrantData)
      .enter()
      .append("text")
      .attr("class", "quadrant-label")
      .attr("x", d => d.x + d.width / 2)
      .attr("y", d => d.y + 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", d => quadrantColorScale(d.quadrant))
      .attr("opacity", 0.7)
      .text(d => d.label.toUpperCase());
    
    // Add grid lines
    const xTicks = [0, 0.25, 0.5, 0.75, 1];
    svg.append("g")
      .attr("class", "grid-lines")
      .style("opacity", 0.2)
      .selectAll("line.vertical")
      .data(xTicks)
      .enter()
      .append("line")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "currentColor")
      .attr("stroke-dasharray", d => d === 0.5 ? "5,5" : "2,2");
    
    const yTicks = yScale.ticks(5);
    svg.append("g")
      .attr("class", "grid-lines")
      .style("opacity", 0.2)
      .selectAll("line.horizontal")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "currentColor")
      .attr("stroke-dasharray", "2,2");
    
    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickValues([0, 0.25, 0.5, 0.75, 1])
        .tickFormat(d => {
          const val = Number(d);
          if (val === 0) return "3+ years";
          if (val === 0.25) return "2 years";
          if (val === 0.5) return "1 year";
          if (val === 0.75) return "3 months";
          return "Immediate";
        }))
      .style("font-size", "12px");
    
    svg.append("g")
      .call(d3.axisLeft(yScale)
        .tickFormat(d => yAxisMetric === 'percent-deaths' ? `${d}%` : String(d)))
      .style("font-size", "12px");
    
    // Add axis labels
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 50)
      .text("Time to Scale (Feasibility)")
      .attr("fill", "currentColor")
      .style("font-size", "14px")
      .style("font-weight", "bold");
    
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -innerHeight / 2)
      .text(yAxisMetric === 'dalys' 
        ? "Impact (DALYs averted per 1,000 population)"
        : "Impact (% Deaths Averted)")
      .attr("fill", "currentColor")
      .style("font-size", "14px")
      .style("font-weight", "bold");
    
    // Add bubbles
    const bubbles = svg.selectAll(".bubble")
      .data(impactData)
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("cx", d => xScale(d.timeToScale))
      .attr("cy", d => yScale(d.impact))
      .attr("r", d => {
        // Always use deaths averted for bubble size, regardless of y-axis metric
        if (!d.scenario.results) return sizeScale(1);
        const baseline = getCountrySpecificBaseline(
          baselineMap, 
          d.scenario.parameters.disease || 'Unknown', 
          d.scenario,
          scenarioMode
        );
        if (!baseline || baseline.cumulativeDeaths === undefined) return sizeScale(1);
        const deathsAverted = Math.abs(baseline.cumulativeDeaths - d.scenario.results.cumulativeDeaths);
        return sizeScale(deathsAverted);
      })
      .style("fill", d => getColor(d))
      .style("fill-opacity", 0.7)
      .style("stroke", "white")
      .style("stroke-width", 2)
      .style("cursor", "pointer");
    
    // Add labels if enabled
    if (showLabels) {
      svg.selectAll(".bubble-label")
        .data(impactData)
        .enter()
        .append("text")
        .attr("class", "bubble-label")
        .attr("x", d => xScale(d.timeToScale))
        .attr("y", d => yScale(d.impact))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", d => {
          // Calculate font size based on actual bubble size
          if (!d.scenario.results) return 10;
          const baseline = getCountrySpecificBaseline(
            baselineMap, 
            d.scenario.parameters.disease || 'Unknown', 
            d.scenario,
            scenarioMode
          );
          if (!baseline || baseline.cumulativeDeaths === undefined) return 10;
          const deathsAverted = Math.abs(baseline.cumulativeDeaths - d.scenario.results.cumulativeDeaths);
          const bubbleRadius = sizeScale(deathsAverted);
          return Math.max(10, Math.min(14, bubbleRadius / 3));
        })
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .attr("stroke", "white")
        .attr("stroke-width", "2px")
        .attr("paint-order", "stroke")
        .attr("pointer-events", "none")
        .text(d => {
          // Special handling for "Test Each AI" scenarios
          const name = d.scenario.name;
          
          // Check if this is a "Test Each AI" scenario
          if (name.includes(' - ') && (name.includes('AI') || name.includes('Baseline'))) {
            // Extract just the AI tool name part
            const parts = name.split(' - ');
            const aiToolPart = parts[0]; // e.g., "AI Health Advisor" or "Baseline (No AI)"
            
            // Use very short abbreviations for AI tools
            const abbreviated = aiToolPart
              .replace('AI Health Advisor', 'SC-Advisor')
              .replace('Diagnostic AI (L1/L2)', 'Diag')
              .replace('Diagnostic AI', 'Diag')
              .replace('Bed Management AI', 'Bed')
              .replace('Hospital Decision Support', 'Hospital')
              .replace('CHW Decision Support', 'CHW')
              .replace('AI Self-Care Platform', 'SC-Platform')
              .replace('Baseline (No AI)', 'Base')
              .replace('Triage AI', 'Triage');
            
            return abbreviated;
          }
          
          // For other scenarios, use shorter truncation
          return name.length > 15 ? name.substring(0, 12) + '...' : name;
        });
    }
    
    // Create tooltip
    const tooltipDiv = document.createElement("div");
    tooltipDiv.style.position = "absolute";
    tooltipDiv.style.backgroundColor = "white";
    tooltipDiv.style.color = "#111";
    tooltipDiv.style.border = "1px solid #ccc";
    tooltipDiv.style.borderRadius = "5px";
    tooltipDiv.style.padding = "12px";
    tooltipDiv.style.zIndex = "99999";
    tooltipDiv.style.pointerEvents = "none";
    tooltipDiv.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    tooltipDiv.style.display = "none";
    tooltipDiv.style.fontSize = "14px";
    tooltipDiv.style.minWidth = "250px";
    tooltipDiv.id = "impact-feasibility-tooltip";
    
    // Remove existing tooltip if present
    const existingTooltip = document.getElementById("impact-feasibility-tooltip");
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    document.body.appendChild(tooltipDiv);
    
    // Add hover interactions
    bubbles.nodes().forEach((node: any) => {
      node.addEventListener("mouseover", function(this: HTMLElement, event: MouseEvent) {
        const data = d3.select(this).datum() as ImpactFeasibilityData;
        
        d3.select(this)
          .style("stroke", "#333")
          .style("stroke-width", 3)
          .style("fill-opacity", 1);
        
        const activeInterventions = Object.entries(data.scenario.aiInterventions)
          .filter(([_, isActive]) => isActive)
          .map(([name]) => {
            switch(name) {
              case 'triageAI': return 'AI Triage';
              case 'chwAI': return 'CHW Decision Support';
              case 'diagnosticAI': return 'Diagnostic AI';
              case 'bedManagementAI': return 'Bed Management AI';
              case 'hospitalDecisionAI': return 'Hospital Decision Support';
              case 'selfCareAI': return 'Self-Care Apps';
              default: return name;
            }
          });
        
        tooltipDiv.innerHTML = `
          <div>
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #eee;">
              ${data.scenario.name}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 8px 4px 0; color: #6B7280;">Quadrant:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500; color: ${quadrantColorScale(data.quadrant)};">
                  ${getQuadrantDisplayName(data.quadrant)}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 8px 4px 0; color: #6B7280;">Impact:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">
                  ${yAxisMetric === 'dalys' 
                    ? `${data.impact.toFixed(2)} DALYs/1000`
                    : `${data.percentDeathsAverted.toFixed(1)}%`}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 8px 4px 0; color: #6B7280;">Time to Scale:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">
                  ${data.timeToScale < 0.25 ? '2+ years' : 
                    data.timeToScale < 0.5 ? '1-2 years' :
                    data.timeToScale < 0.75 ? '3-12 months' : 'Immediate'}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 8px 4px 0; color: #6B7280;">Deaths Averted (bubble size):</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">
                  ${(() => {
                    const baseline = getCountrySpecificBaseline(
                      baselineMap, 
                      data.scenario.parameters.disease || 'Unknown', 
                      data.scenario,
                      scenarioMode
                    );
                    
                    console.log('Deaths averted calculation:', {
                      scenario: data.scenario.name,
                      baseline: baseline,
                      results: data.scenario.results,
                      baselineDeaths: baseline?.cumulativeDeaths,
                      resultDeaths: data.scenario.results?.cumulativeDeaths
                    });
                    
                    if (!baseline || !data.scenario.results) return 'N/A';
                    
                    const deathsAverted = baseline.cumulativeDeaths - data.scenario.results.cumulativeDeaths;
                    return deathsAverted >= 0 
                      ? formatNumber(deathsAverted)
                      : formatNumber(Math.abs(deathsAverted)) + ' additional';
                  })()}
                </td>
              </tr>
              ${yAxisMetric === 'dalys' ? `
              <tr>
                <td style="padding: 4px 8px 4px 0; color: #6B7280;">Total DALYs Averted:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">
                  ${(() => {
                    const baseline = getCountrySpecificBaseline(
                      baselineMap, 
                      data.scenario.parameters.disease || 'Unknown', 
                      data.scenario,
                      scenarioMode
                    );
                    if (!baseline || !data.scenario.results) return 'N/A';
                    
                    const dalysAverted = baseline.dalys - data.scenario.results.dalys;
                    return dalysAverted >= 0 
                      ? formatNumber(dalysAverted)
                      : formatNumber(Math.abs(dalysAverted)) + ' additional';
                  })()}
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding: 4px 8px 4px 0; color: #6B7280;">Disease:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">
                  ${data.scenario.parameters.disease || 'Unknown'}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 8px 4px 0; color: #6B7280;">Country:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">
                  ${data.scenario.countryName || 'Generic'} ${data.scenario.isUrban !== undefined ? (data.scenario.isUrban ? '(Urban)' : '(Rural)') : ''}
                </td>
              </tr>
              ${data.scenario.results?.icer ? `
              <tr>
                <td style="padding: 4px 8px 4px 0; color: #6B7280;">Cost-effectiveness:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">
                  $${formatNumber(data.scenario.results.icer)}/DALY
                </td>
              </tr>
              ` : ''}
            </table>
            ${activeInterventions.length > 0 ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
              <div style="font-weight: 500; margin-bottom: 5px;">AI Interventions:</div>
              <ul style="margin: 0; padding-left: 20px;">
                ${activeInterventions.map(i => `<li style="font-size: 12px;">${i}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
          </div>
        `;
        
        tooltipDiv.style.left = (event.pageX + 10) + "px";
        tooltipDiv.style.top = (event.pageY + 10) + "px";
        tooltipDiv.style.display = "block";
      });
      
      node.addEventListener("mouseout", function(this: HTMLElement) {
        d3.select(this)
          .style("stroke", "white")
          .style("stroke-width", 2)
          .style("fill-opacity", 0.7);
        
        tooltipDiv.style.display = "none";
      });
      
      node.addEventListener("mousemove", function(this: HTMLElement, event: MouseEvent) {
        tooltipDiv.style.left = (event.pageX + 10) + "px";
        tooltipDiv.style.top = (event.pageY + 10) + "px";
      });
    });
    
    // Add bubble size legend at bottom right of chart
    const legend = svg.append("g")
      .attr("transform", `translate(${innerWidth - 150}, ${innerHeight - 145})`);
    
    // Add semi-transparent background for legend
    legend.append("rect")
      .attr("x", -10)
      .attr("y", -10)
      .attr("width", 160)
      .attr("height", 155)
      .attr("fill", "white")
      .attr("fill-opacity", 0.9)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1)
      .attr("rx", 5);
    
    legend.append("text")
      .attr("x", 5)
      .attr("y", 10)
      .attr("font-size", "13px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("Bubble Size:");
    
    legend.append("text")
      .attr("x", 5)
      .attr("y", 28)
      .attr("font-size", "11px")
      .attr("fill", "#666")
      .text("Deaths Averted");
    
    // Add example bubbles to show scale
    const legendBubbles = [
      { size: 10, label: "10" },
      { size: 100, label: "100" },
      { size: 1000, label: "1,000" },
      { size: Math.min(10000, maxDeathsAverted), label: formatNumber(Math.min(10000, maxDeathsAverted)) }
    ];
    
    legendBubbles.forEach((bubble, i) => {
      const yOffset = 50 + (i * 25);
      const radius = sizeScale(bubble.size);
      
      legend.append("circle")
        .attr("cx", 25)
        .attr("cy", yOffset)
        .attr("r", radius)
        .attr("fill", "#999")
        .attr("fill-opacity", 0.3)
        .attr("stroke", "#666")
        .attr("stroke-width", 1);
      
      legend.append("text")
        .attr("x", 50)
        .attr("y", yOffset + 4)
        .attr("font-size", "11px")
        .attr("fill", "#666")
        .text(bubble.label);
    });
    
    // Cleanup
    return () => {
      const tooltip = document.getElementById("impact-feasibility-tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    };
  }, [scenarios, selectedDiseases, selectedCountries, showLabels, baselineMap, yAxisMetric, colorBy, availableCountries, availableDiseases]);

  if (scenarios.length <= 1) {
    return (
      <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          You need at least two saved scenarios to generate an impact-feasibility chart.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Impact vs Feasibility Analysis
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Y-axis metric:</label>
            <select
              value={yAxisMetric}
              onChange={(e) => setYAxisMetric(e.target.value as 'dalys' | 'percent-deaths')}
              className="form-select text-sm"
            >
              <option value="dalys">DALYs per 1,000 population</option>
              <option value="percent-deaths">% Deaths Averted</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Color by:</label>
            <select
              value={colorBy}
              onChange={(e) => setColorBy(e.target.value as 'quadrant' | 'country' | 'disease')}
              className="form-select text-sm"
            >
              <option value="quadrant">Quadrant</option>
              <option value="country">Country</option>
              <option value="disease">Disease</option>
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Show labels</span>
          </label>
        </div>
      </div>
      
      {/* Disease filters */}
      <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Disease:</h4>
          <div className="flex gap-2">
            <button
              onClick={selectAllDiseases}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearAllDiseases}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableDiseases.map(disease => (
            <label key={disease} className="inline-flex items-center">
              <input
                type="checkbox"
                checked={selectedDiseases.has(disease)}
                onChange={() => toggleDiseaseFilter(disease)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              {colorBy === 'disease' && (
                <span 
                  className="ml-1 inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: diseaseColorScale(disease) }}
                />
              )}
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {disease === 'health_system_total' 
                  ? 'Health System Total' 
                  : disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                }
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Country filters */}
      {availableCountries.length > 1 && (
        <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Country:</h4>
            <div className="flex gap-2">
              <button
                onClick={selectAllCountries}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearAllCountries}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableCountries.map(country => (
              <label key={country} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCountries.has(country)}
                  onChange={() => toggleCountryFilter(country)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                {colorBy === 'country' && (
                  <span 
                    className="ml-1 inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: countryColorScale(country) }}
                  />
                )}
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{country}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Chart container */}
      <div ref={chartRef} className="w-full h-[600px]"></div>
      
      {/* Quadrant descriptions */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">Big Bets</h4>
          <p className="text-green-700 dark:text-green-300">
            High impact interventions that can be deployed quickly. Priority for immediate investment.
          </p>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Moonshots</h4>
          <p className="text-yellow-700 dark:text-yellow-300">
            High impact but require more time to implement. Worth long-term investment.
          </p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Quick Wins</h4>
          <p className="text-blue-700 dark:text-blue-300">
            Lower impact but quick to deploy. Consider for incremental improvements.
          </p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900 rounded-lg">
          <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">Incremental</h4>
          <p className="text-red-700 dark:text-red-300">
            Lower impact and slow to implement. Generally lower priority.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImpactFeasibilityBubbleChart; 