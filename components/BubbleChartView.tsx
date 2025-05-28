import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { scenariosAtom, Scenario, updateScenarioAtom } from '../lib/store';
import { formatNumber, estimateTimeToScale } from '../lib/utils';
import * as d3 from 'd3';
import { baselineResultsMapAtom } from '../lib/store';

const BubbleChartView: React.FC = () => {
  const [scenarios] = useAtom(scenariosAtom);
  const [, updateScenario] = useAtom(updateScenarioAtom);
  const [baselineMap] = useAtom(baselineResultsMapAtom);
  const [sizeMetric, setSizeMetric] = useState<'dalys' | 'deaths'>('dalys');
  const [selectedDiseases, setSelectedDiseases] = useState<Set<string>>(new Set());
  const [availableDiseases, setAvailableDiseases] = useState<string[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Initialize available diseases when scenarios change
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
  
  // Handle disease filter toggle
  const toggleDiseaseFilter = (disease: string) => {
    const newSelectedDiseases = new Set(selectedDiseases);
    
    if (newSelectedDiseases.has(disease)) {
      // If all diseases would be deselected, don't allow it
      if (newSelectedDiseases.size > 1) {
        newSelectedDiseases.delete(disease);
      }
    } else {
      newSelectedDiseases.add(disease);
    }
    
    setSelectedDiseases(newSelectedDiseases);
  };
  
  // Toggle all disease filters
  const toggleAllDiseases = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedDiseases(new Set(availableDiseases));
    } else {
      // Keep at least one disease selected
      setSelectedDiseases(new Set([availableDiseases[0]].filter(Boolean)));
    }
  };

  // Create the bubble chart visualization
  useEffect(() => {
    if (!chartRef.current || scenarios.length <= 1) return;

    const width = chartRef.current.clientWidth;
    const height = 500;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    
    // Get valid scenarios
    const validScenarios = scenarios.filter(s => {
      return s.results && 
             selectedDiseases.has(s.parameters.disease || 'Unknown');
    });
    
    if (validScenarios.length <= 0) return;

    d3.select(chartRef.current).selectAll("svg").remove();
    
    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Get cost-effectiveness values (ICER or cost/DALY if ICER not available)
    const getCostEffectiveness = (scenario: Scenario): number => {
      if (!scenario.results) return 0;
      if (scenario.results.icer) return scenario.results.icer;
      return scenario.results.totalCost / scenario.results.dalys;
    };
    
    // Define scales
    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, innerWidth]);
    
    const costEffectivenessValues = validScenarios.map(getCostEffectiveness);
    const hasNegativeValues = costEffectivenessValues.some(val => val <= 0); // Include zero values as well
    const positiveValues = costEffectivenessValues.filter(val => val > 0);

    // Define max y value - either 10000 or the largest value if larger than 10000
    const maxPositiveValue = positiveValues.length ? Math.max(...positiveValues) : 10000;
    const yMax = Math.max(10000, maxPositiveValue * 1.1);

    // Create a log scale for positive values, but place cost-effective values at top
    // We use two different scales - one for positioning and one for the axis
    // This is a log scale with a special case for highly cost-effective values (ICER <= 0.1)
    const yPositionScale = (value: number): number => {
      if (value <= 0.1) {
        return 40; // Position for cost-effective values (ICER <= 0.1) at top of chart
      }
      return d3.scaleLog()
        .domain([Math.max(1000, yMax), 0.1]) // Range from 0.1 (or lower) to 1000 (or higher)
        .range([innerHeight, 40]) // Bottom to top
        .clamp(true)(value);
    };

    // Custom function to position y-values, placing all negative values at -1 visual position
    const getYPosition = (scenario: Scenario): number => {
      const costEffectiveness = getCostEffectiveness(scenario);
      return yPositionScale(costEffectiveness);
    };

    // Create axis scale for display
    const yScale = d3.scaleLog()
      .domain([Math.max(1000, yMax), 0.1]) // Range from 0.1 to 1000 (or higher)
      .range([innerHeight, 40]) // Bottom (innerHeight) to top (40)
      .clamp(true);

    // Generate custom tick values for the log scale
    const generateTickValues = () => {
      // Generate logarithmic tick values for the positive range
      const logBase = 10;
      const minExp = -1; // Starting from 10^-1 = 0.1
      const maxExp = Math.ceil(Math.log10(Math.max(1000, yMax)));
      
      const tickValues = [0.1]; // Start with 0.1 (our minimum threshold)
      
      // Add powers of 10
      for (let exp = 0; exp <= maxExp; exp++) {
        tickValues.push(Math.pow(logBase, exp));
      }
      
      // Add some intermediate values for more reasonable ticks
      if (maxExp <= 3) {
        // If the range is small, add more intermediate ticks
        for (let exp = 0; exp < maxExp; exp++) {
          for (let i = 2; i <= 5; i++) {
            tickValues.push(i * Math.pow(logBase, exp));
          }
        }
      } else {
        // If the range is larger, add fewer intermediate ticks
        for (let exp = 0; exp < maxExp; exp++) {
          tickValues.push(5 * Math.pow(logBase, exp));
        }
      }
      
      return tickValues;
    };

    const tickValues = generateTickValues();
    
    // Get size values based on selected metric (representing averted DALYs/deaths)
    const getSizeValue = (scenario: Scenario): number => {
      if (!scenario.results) return 0;
      
      // Get the specific disease for this scenario
      const disease = scenario.parameters.disease || 'Unknown';
      
      // ENHANCED BASELINE SELECTION LOGIC
      let diseaseBaseline = null;
      
      // 1. First choice: Disease-specific baseline from baselineMap
      if (baselineMap[disease]) {
        diseaseBaseline = baselineMap[disease];
      } 
      // 2. Second choice: Scenario's own baselineResults
      else if (scenario.baselineResults) {
        diseaseBaseline = scenario.baselineResults;
      }
      // 3. Last resort: Use first available baseline from baselineMap
      else if (Object.keys(baselineMap).length > 0) {
        const firstAvailableDisease = Object.keys(baselineMap)[0];
        diseaseBaseline = baselineMap[firstAvailableDisease];
        console.warn(`WARNING: No specific baseline for ${disease}, falling back to ${firstAvailableDisease} baseline`);
      }
      
      // If still no baseline, log warning and use a placeholder value
      if (!diseaseBaseline) {
        console.warn(`WARNING: No baseline results found for disease: ${disease} in scenario: ${scenario.name}`);
        
        // Return some reasonable default size to ensure visibility
        // Use a size proportional to the scenario's own results to ensure some differentiation
        return sizeMetric === 'dalys' 
          ? Math.max(1000, scenario.results.dalys * 0.1) // ~10% of current DALYs
          : Math.max(10, scenario.results.cumulativeDeaths * 0.1); // ~10% of current deaths
      }
      
      // Calculate the averted values correctly based on the available baseline
      if (sizeMetric === 'dalys') {
        const dalysAverted = diseaseBaseline.dalys - scenario.results.dalys;
        
        // Cap extremely large values to prevent visual distortion
        if (Math.abs(dalysAverted) > 10000000) {
          return dalysAverted > 0 ? 10000000 : 0;
        }
        
        // For averted values, higher is better, so return max of 0 or the actual value
        return Math.max(0, dalysAverted);
      } else {
        const deathsAverted = diseaseBaseline.cumulativeDeaths - scenario.results.cumulativeDeaths;
        
        // Cap extremely large values to prevent visual distortion
        if (Math.abs(deathsAverted) > 100000) {
          return deathsAverted > 0 ? 100000 : 0;
        }
        
        // For averted values, higher is better, so return max of 0 or the actual value
        return Math.max(0, deathsAverted);
      }
    };
    
    // Get size values 
    const sizeValues = validScenarios.map(s => getSizeValue(s));
    const maxSize = Math.max(...sizeValues);
    
    // Use a fixed scale for bubble sizes to ensure consistency
    // This ensures different thresholds for deaths vs DALYs
    const sizeScale = d3.scaleSqrt()
      .domain(sizeMetric === 'deaths' 
        ? [0, 10, 1000, 100000]  // Deaths thresholds: 10 for small, 1000 for medium, 100,000 for large
        : [0, 1000, 100000, 10000000])  // DALYs thresholds: 1,000 for small, 100,000 for medium, 10,000,000 for large
      .range([0, 5, 25, 50])
      .clamp(true);
    
    // Create color scale based on disease - using a more accessible color scheme
    const diseaseTypes = Array.from(new Set(validScenarios.map(s => s.parameters.disease || 'Other')));
    const colorScale = d3.scaleOrdinal<string>()
      .domain(diseaseTypes)
      .range(["#2a9d8f", "#e9c46a", "#f4a261", "#e76f51", "#264653", "#023047", "#ffb703", "#fb8500", "#8ecae6"]);
    
    // Add background grid
    svg.append("g")
      .attr("class", "grid-lines")
      .style("opacity", 0.1)
      .selectAll("line.horizontal")
      .data(tickValues)
      .enter()
      .append("line")
      .attr("class", "horizontal")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "currentColor");
    
    // Add vertical grid lines
    const xTicks = [0, 0.25, 0.5, 0.75, 1];
    svg.append("g")
      .attr("class", "grid-lines")
      .style("opacity", 0.1)
      .selectAll("line.vertical")
      .data(xTicks)
      .enter()
      .append("line")
      .attr("class", "vertical")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "currentColor")
      .attr("stroke-dasharray", d => d === 0.5 ? "5,5" : "2,2");
    
    // Add X axis
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
      .style("font-size", "11px");
    
    // Add X axis label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .text("Time to Scale (Feasibility)")
      .attr("fill", "currentColor")
      .style("font-size", "12px");
    
    // Add Y axis with formatted labels
    // Create a custom axis that combines the log scale with special formatting for cost-effective values
    const yAxis = d3.axisLeft(yScale)
      .tickValues(tickValues)
      .tickFormat(d => {
        if (d === 0.1) return "≤ $0.1"; // Special label for cost-effective threshold
        return `$${formatNumber(Number(d))}`;
      });

    // Add the main axis
    const yAxisGroup = svg.append("g").call(yAxis);

    // Add cost-effective zone highlighting
    // Add horizontal line for the cost-effective threshold
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", 40) // Position at 0.1 threshold
      .attr("y2", 40)
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "5,5");
      
    // Add a highlight area for the cost-effective zone
    svg.append("rect")
      .attr("x", 0)
      .attr("y", 30) // Just at the top of chart
      .attr("width", innerWidth)
      .attr("height", 20) // Height of the highlight
      .attr("fill", "#bde0fe") // Light blue
      .attr("opacity", 0.3) // Subtle highlight
      .attr("rx", 5) // Rounded corners
      .attr("ry", 5);
      
    // Add text indicating this is a special zone
    svg.append("text")
      .attr("x", innerWidth - 20)
      .attr("y", 43)
      .attr("text-anchor", "end")
      .attr("font-size", "11px")
      .attr("font-style", "italic")
      .attr("fill", "#2a9d8f")
      .text("Highly cost-effective (ICER ≤ $0.1)");
    
    // Add Y axis label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -innerHeight / 2)
      .text("Cost-effectiveness (lower is better)")
      .attr("fill", "currentColor")
      .style("font-size", "12px");
    
    // Add a "better" annotation in the top right quadrant
    svg.append("text")
      .attr("x", innerWidth - 60)
      .attr("y", 70) // Move down to avoid overlap with negative ICER zone
      .text("Better")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#2a9d8f")
      .attr("text-anchor", "middle");
    
    // Add an arrow pointing to the top right
    svg.append("path")
      .attr("d", "M" + (innerWidth - 60) + " " + 80 + " L" + (innerWidth - 40) + " " + 80 + " L" + (innerWidth - 50) + " " + 70 + " Z")
      .attr("fill", "#2a9d8f");
    
    // Force simulation to prevent overlapping bubbles
    // Create a typed version of the data for simulation
    const simulationNodes = validScenarios.map(scenario => {
      // Use the shared time-to-scale estimation
      const timeToScale = scenario.feasibility !== undefined 
        ? scenario.feasibility 
        : estimateTimeToScale(scenario.aiInterventions);

      return {
        ...scenario,
        x: xScale(timeToScale),
        y: getYPosition(scenario),
        r: sizeScale(getSizeValue(scenario))
      };
    });
    
    const simulation = d3.forceSimulation(simulationNodes as d3.SimulationNodeDatum[])
      .force("x", d3.forceX<d3.SimulationNodeDatum>(d => (d as any).x).strength(0.25)) // Balanced x force
      .force("y", d3.forceY<d3.SimulationNodeDatum>(d => (d as any).y).strength(0.75)) // Keep stronger y force for vertical accuracy
      .force("collide", d3.forceCollide<d3.SimulationNodeDatum>(d => (d as any).r + 1.5).strength(0.5)) // Moderate collision strength
      .stop();
    
    // Run the simulation for a fixed number of iterations
    for (let i = 0; i < 150; i++) simulation.tick(); // Increase iterations for better settling
    
    // Add bubbles
    const bubbles = svg.selectAll("circle")
      .data(simulationNodes)
      .enter()
      .append("circle")
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y)
      .attr("r", (d: any) => d.r)
      .style("fill", (d: Scenario) => colorScale(d.parameters.disease || 'Other'))
      .style("fill-opacity", 0.8)
      .style("stroke", "white")
      .style("stroke-width", 1)
      // Add a basic HTML title as a fallback tooltip
      .attr("title", (d: any) => `${d.name}: $${formatNumber(getCostEffectiveness(d))}`);
      
    // Create a completely basic tooltip div directly in the DOM
    const tooltipDiv = document.createElement("div");
    tooltipDiv.style.position = "absolute"; // Changed from fixed to absolute for better positioning
    tooltipDiv.style.backgroundColor = "white";
    tooltipDiv.style.color = "#111";
    tooltipDiv.style.border = "1px solid #ccc";
    tooltipDiv.style.borderRadius = "5px";
    tooltipDiv.style.padding = "12px";
    tooltipDiv.style.zIndex = "99999"; // Super high to ensure it's on top
    tooltipDiv.style.pointerEvents = "none";
    tooltipDiv.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    tooltipDiv.style.display = "none";
    tooltipDiv.style.fontSize = "14px";
    tooltipDiv.style.fontWeight = "400";
    tooltipDiv.style.minWidth = "220px";
    tooltipDiv.style.maxWidth = "300px";
    tooltipDiv.id = "bubble-chart-tooltip"; // Add ID for easy reference
    
    // Check if dark mode is enabled
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Or check if there's a dark class on the body/html
    const bodyHasDarkClass = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
    
    // Apply dark mode styles if needed
    if (prefersDarkMode || bodyHasDarkClass) {
      tooltipDiv.style.backgroundColor = "#1F2937"; // dark gray
      tooltipDiv.style.color = "#F9FAFB"; // light gray
      tooltipDiv.style.border = "1px solid #374151"; // darker border
    }
    
    // Remove existing tooltip if one exists
    const existingTooltip = document.getElementById("bubble-chart-tooltip");
    if (existingTooltip && existingTooltip.parentNode) {
      existingTooltip.parentNode.removeChild(existingTooltip);
    }
    
    document.body.appendChild(tooltipDiv);
    
    // Add event listeners using regular DOM methods
    bubbles.nodes().forEach((node: any) => {
      node.addEventListener("mouseover", function(this: HTMLElement, event: MouseEvent) {
        const data = d3.select(this).datum() as any;
        
        // Style the bubble
        d3.select(this)
          .style("stroke", "#333")
          .style("stroke-width", 2)
          .style("fill-opacity", 1);
        
        // Get time to scale for display
        const timeToScale = data.feasibility !== undefined 
          ? data.feasibility 
          : estimateTimeToScale(data.aiInterventions);
        
        // Set content first
        tooltipDiv.innerHTML = `
          <div>
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid ${prefersDarkMode || bodyHasDarkClass ? '#374151' : '#eee'};">${data.name}</div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 8px 4px 0; color: ${prefersDarkMode || bodyHasDarkClass ? '#9CA3AF' : '#6B7280'};">Time to Scale:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">
                  ${timeToScale < 0.25 ? '2+ years' : 
                    timeToScale < 0.5 ? '1-2 years' :
                    timeToScale < 0.75 ? '3-12 months' : 'Immediate'}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 8px 4px 0; color: ${prefersDarkMode || bodyHasDarkClass ? '#9CA3AF' : '#6B7280'};">Cost-effectiveness:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">$${formatNumber(getCostEffectiveness(data))}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px 4px 0; color: ${prefersDarkMode || bodyHasDarkClass ? '#9CA3AF' : '#6B7280'};">${sizeMetric === 'dalys' ? 'DALYs' : 'Deaths'} averted:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatNumber(getSizeValue(data))}</td>
              </tr>
              ${data.baselineResults ? `
              <tr>
                <td style="padding: 4px 8px 4px 0; color: ${prefersDarkMode || bodyHasDarkClass ? '#9CA3AF' : '#6B7280'};">Baseline ${sizeMetric === 'dalys' ? 'DALYs' : 'Deaths'}:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatNumber(sizeMetric === 'dalys' ? data.baselineResults.dalys : data.baselineResults.cumulativeDeaths)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 8px 4px 0; color: ${prefersDarkMode || bodyHasDarkClass ? '#9CA3AF' : '#6B7280'};">Current ${sizeMetric === 'dalys' ? 'DALYs' : 'Deaths'}:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatNumber(sizeMetric === 'dalys' ? data.results.dalys : data.results.cumulativeDeaths)}</td>
              </tr>
              ` : ''}
              ${data.parameters.disease ? `
              <tr>
                <td style="padding: 4px 8px 4px 0; color: ${prefersDarkMode || bodyHasDarkClass ? '#9CA3AF' : '#6B7280'};">Disease:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.parameters.disease}</td>
              </tr>
              ` : ''}
              ${data.parameters.healthSystemStrength ? `
              <tr>
                <td style="padding: 4px 8px 4px 0; color: ${prefersDarkMode || bodyHasDarkClass ? '#9CA3AF' : '#6B7280'};">Health System:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.parameters.healthSystemStrength}</td>
              </tr>
              ` : ''}
            </table>
          </div>
        `;
        
        // Simple positioning directly with pageX/pageY
        const offset = 10;
        tooltipDiv.style.left = (event.pageX + offset) + "px";
        tooltipDiv.style.top = (event.pageY + offset) + "px";
        
        // Show tooltip
        tooltipDiv.style.display = "block";
      });
      
      node.addEventListener("mouseout", function(this: HTMLElement) {
        // Reset bubble style
        d3.select(this)
          .style("stroke", "white")
          .style("stroke-width", 1)
          .style("fill-opacity", 0.8);
        
        // Hide tooltip immediately
        tooltipDiv.style.display = "none";
      });
      
      node.addEventListener("mousemove", function(this: HTMLElement, event: MouseEvent) {
        // Simple positioning directly with pageX/pageY
        const offset = 10;
        tooltipDiv.style.left = (event.pageX + offset) + "px";
        tooltipDiv.style.top = (event.pageY + offset) + "px";
      });
    });
    
    // Add bubble names/labels that don't interfere with hovering
    const bubbleLabels = svg.selectAll(".bubble-label")
      .data(simulationNodes)
      .enter()
      .append("g")
      .attr("class", "bubble-label")
      .attr("pointer-events", "none") // Very important - prevents labels from capturing mouse events
      .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`); // Position in center of bubble
    
    // Add text label directly in the center
    bubbleLabels.append("text")
      .text((d: any) => d.name)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle") // Center vertically
      .attr("font-size", (d: any) => Math.max(9, Math.min(12, d.r / 4))) // Responsive font size based on bubble size
      .attr("font-weight", "700")
      .attr("fill", "#333") // Dark text
      .attr("stroke", "white") // White text outline for better contrast on dark backgrounds
      .attr("stroke-width", "1.2px") // Increased stroke width
      .attr("stroke-opacity", "0.9") // More opaque stroke
      .attr("paint-order", "stroke") // Ensures the stroke is behind the text
      .attr("pointer-events", "none");
    
    // Add legend for bubble size
    const legendSize = svg.append("g")
      .attr("transform", `translate(${innerWidth - 160}, ${innerHeight - 180})`);
    
    const legendTitle = sizeMetric === 'dalys' ? 'DALYs Averted' : 'Deaths Averted';
    
    // Add legend title
    legendSize.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .text(legendTitle);
    
    // Use fixed size values for the legend to ensure consistency
    const legendSizes = sizeMetric === 'deaths'
      ? [
          10,         // Small bubble (10 deaths)
          1000,       // Medium bubble (1,000 deaths)
          100000      // Large bubble (100,000 deaths)
        ]
      : [
          1000,        // Small bubble (1,000 DALYs)
          100000,      // Medium bubble (100,000 DALYs)
          10000000     // Large bubble (10,000,000 DALYs)
        ];
    
    // Add legend subtitle
    legendSize.append("text")
      .attr("x", 0)
      .attr("y", 15)
      .attr("font-size", "10px")
      .attr("fill", "currentColor")
      .style("font-style", "italic")
      .text("Bubble size represents:");
    
    // Add bubble circles with horizontal alignment
    const legendG = legendSize.selectAll(".legend-entry")
      .data(legendSizes)
      .enter()
      .append("g")
      .attr("class", "legend-entry")
      .attr("transform", (d: number, i: number) => `translate(0, ${35 + i * 30})`);
    
    // Add the circles
    legendG.append("circle")
      .attr("cx", 10)
      .attr("cy", 0)
      .attr("r", (d: number) => sizeScale(d))
      .style("fill", "none")
      .style("stroke", "currentColor")
      .style("stroke-width", 1);
    
    // Add values with better formatting
    legendG.append("text")
      .attr("x", 45)
      .attr("y", 5)
      .attr("font-size", "11px")
      .attr("fill", "currentColor")
      .text((d: number, i: number) => {
        if (i === 0) return `Small: ${formatNumber(d)}`;
        if (i === 1) return `Medium: ${formatNumber(d)}`;
        return `Large: ${formatNumber(d)}`;
      });
    
    // Add color legend for disease types
    const colorLegend = svg.append("g")
      .attr("transform", `translate(20, ${innerHeight - 180})`);
    
    // Add color legend title
    colorLegend.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .text("Diseases:");
    
    // Add color legend entries
    const colorLegendEntries = colorLegend.selectAll(".color-legend-entry")
      .data(diseaseTypes)
      .enter()
      .append("g")
      .attr("class", "color-legend-entry")
      .attr("transform", (d: string, i: number) => `translate(0, ${20 + i * 20})`);
    
    // Add color squares
    colorLegendEntries.append("rect")
      .attr("x", 0)
      .attr("y", -10)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", (d: string) => colorScale(d));
    
    // Add disease names
    colorLegendEntries.append("text")
      .attr("x", 20)
      .attr("y", -1)
      .attr("font-size", "11px")
      .attr("fill", "currentColor")
      .text((d: string) => d);
    
    // Clean up function for component unmount
    return () => {
      // Clean up tooltip div
      const tooltip = document.getElementById("bubble-chart-tooltip");
      if (tooltip && document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    };
  }, [scenarios, sizeMetric, selectedDiseases]);

  // If no scenarios or only one scenario, show a message
  if (scenarios.length <= 1) {
    return (
      <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          You need at least two saved scenarios to generate a comparison chart.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">IPM Bubble Chart</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Bubble size:</label>
            <select
              value={sizeMetric}
              onChange={(e) => setSizeMetric(e.target.value as 'dalys' | 'deaths')}
              className="form-select text-sm"
            >
              <option value="dalys">DALYs Averted</option>
              <option value="deaths">Deaths Averted</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Disease filter controls */}
      <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Disease:</h4>
          <div className="space-x-2">
            <button 
              onClick={() => toggleAllDiseases(true)}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Select All
            </button>
            <button 
              onClick={() => toggleAllDiseases(false)}
              className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
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
      
      <div className="mb-6 relative">
        <div ref={chartRef} className="w-full h-[500px]"></div>
      </div>
    </div>
  );
};

export default BubbleChartView; 