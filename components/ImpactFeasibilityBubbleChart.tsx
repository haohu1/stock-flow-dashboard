import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { scenariosAtom, Scenario, updateScenarioAtom, aiTimeToScaleParametersAtom } from '../lib/store';
import { formatNumber, estimateTimeToScale } from '../lib/utils';
import * as d3 from 'd3';
import { baselineResultsMapAtom } from '../lib/store';

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
  const [yAxisMetric, setYAxisMetric] = useState<'dalys' | 'percent-deaths'>('percent-deaths');
  const [selectedDiseases, setSelectedDiseases] = useState<Set<string>>(new Set());
  const [availableDiseases, setAvailableDiseases] = useState<string[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  // Initialize disease filters
  useEffect(() => {
    const diseaseSet = new Set<string>();
    scenarios.forEach(scenario => {
      const disease = scenario.parameters.disease || 'Unknown';
      diseaseSet.add(disease);
    });
    
    const diseaseList = Array.from(diseaseSet).sort();
    setAvailableDiseases(diseaseList);
    
    if (selectedDiseases.size === 0 && diseaseList.length > 0) {
      setSelectedDiseases(new Set(diseaseList));
    }
  }, [scenarios, selectedDiseases]);

  // Calculate impact metrics for each scenario
  const calculateImpactData = (scenario: Scenario): ImpactFeasibilityData | null => {
    if (!scenario.results) return null;
    
    const disease = scenario.parameters.disease || 'Unknown';
    const diseaseBaseline = baselineMap[disease] || scenario.baselineResults;
    
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
    const populationImpact = yAxisMetric === 'dalys' ? dalysAverted : deathsAverted;
    
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

  // Create the visualization
  useEffect(() => {
    if (!chartRef.current || scenarios.length <= 1) return;

    const width = chartRef.current.clientWidth;
    const height = 600;
    const margin = { top: 40, right: 150, bottom: 80, left: 80 };
    
    // Get valid scenarios with impact data
    const impactData = scenarios
      .filter(s => selectedDiseases.has(s.parameters.disease || 'Unknown'))
      .map(calculateImpactData)
      .filter((d): d is ImpactFeasibilityData => d !== null);
    
    if (impactData.length === 0) return;

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
    
    const impactValues = impactData.map(d => d.impact);
    const maxImpact = yAxisMetric === 'dalys' 
      ? Math.max(...impactValues, 100) // Minimum of 100 DALYs per 1000 to show threshold clearly
      : Math.max(...impactValues, 50); // Minimum of 50% for percentage scale
    
    const yScale = d3.scaleLinear()
      .domain([0, maxImpact * 1.1])
      .range([innerHeight, 0]);
    
    // Size scale for bubbles - use all scenarios for consistent sizing
    const allImpactData = scenarios
      .map(calculateImpactData)
      .filter((d): d is ImpactFeasibilityData => d !== null);
    
    const maxPopulationImpact = allImpactData.length > 0 
      ? Math.max(...allImpactData.map(d => d.populationImpact))
      : 1000; // fallback value
    
    const sizeScale = d3.scaleSqrt()
      .domain([0, maxPopulationImpact])
      .range([5, 50]);
    
    // Color scale for quadrants
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['big-bets', 'moonshots', 'quick-wins', 'incremental'])
      .range(['#2a9d8f', '#e9c46a', '#8ecae6', '#e76f51']);
    
    // Calculate dynamic thresholds based on data
    const impactThreshold = yAxisMetric === 'dalys' ? 100 : 10; // Same as in determineQuadrant
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
      .attr("fill", d => colorScale(d.quadrant))
      .attr("opacity", 0.1);
    
    // Add threshold lines for clarity
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
    
    svg.append("text")
      .attr("x", 5)
      .attr("y", impactThresholdY - 5)
      .attr("font-size", "11px")
      .attr("fill", "#666")
      .text(yAxisMetric === 'dalys' ? "100 DALYs/1000" : "10% deaths");
    
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
      .attr("fill", d => colorScale(d.quadrant))
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
      .attr("r", d => sizeScale(d.populationImpact))
      .style("fill", d => colorScale(d.quadrant))
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
        .attr("font-size", d => Math.max(10, Math.min(14, sizeScale(d.populationImpact) / 3)))
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .attr("stroke", "white")
        .attr("stroke-width", "2px")
        .attr("paint-order", "stroke")
        .attr("pointer-events", "none")
        .text(d => d.scenario.name.length > 20 ? d.scenario.name.substring(0, 20) + '...' : d.scenario.name);
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
                <td style="padding: 4px 0; text-align: right; font-weight: 500; color: ${colorScale(data.quadrant)};">
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
                <td style="padding: 4px 8px 4px 0; color: #6B7280;">${yAxisMetric === 'dalys' ? 'Total DALYs Averted' : 'Total Deaths Averted'}:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">
                  ${formatNumber(data.populationImpact)}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 8px 4px 0; color: #6B7280;">Disease:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">
                  ${data.scenario.parameters.disease || 'Unknown'}
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
    
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${innerWidth + 20}, 20)`);
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .text("Bubble Size:");
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", 20)
      .attr("font-size", "12px")
      .attr("fill", "currentColor")
      .text(yAxisMetric === 'dalys' ? "Total DALYs" : "Total Deaths");
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", 35)
      .attr("font-size", "12px")
      .attr("fill", "currentColor")
      .text("Averted");
    
    // Cleanup
    return () => {
      const tooltip = document.getElementById("impact-feasibility-tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    };
  }, [scenarios, selectedDiseases, showLabels, baselineMap, yAxisMetric]);

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
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{disease}</span>
            </label>
          ))}
        </div>
      </div>
      
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