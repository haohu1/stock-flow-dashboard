import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import SensitivityAnalysis from '../components/SensitivityAnalysis';
import ParametersPanel from '../components/ParametersPanel';
import EquationExplainer from '../components/EquationExplainer';
import ParameterGuide from '../components/ParameterGuide';
import ScenarioManager from '../components/ScenarioManager';
import AIInterventionManager from '../components/AIInterventionManager';
import BubbleChartView from '../components/BubbleChartView';
import ImpactFeasibilityBubbleChart from '../components/ImpactFeasibilityBubbleChart';
import { useAtom } from 'jotai';
import { simulationResultsAtom, aiInterventionsAtom, scenariosAtom } from '../lib/store';

type TabType = 'dashboard' | 'scenarios' | 'interventions' | 'sensitivity' | 'parameters' | 'equations' | 'parameter-guide' | 'ipm-bubble' | 'impact-bubble';

export default function Home() {
  const [results] = useAtom(simulationResultsAtom);
  const [aiInterventions] = useAtom(aiInterventionsAtom);
  const [scenarios] = useAtom(scenariosAtom);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [preSimulationTab, setPreSimulationTab] = useState<'dashboard' | 'scenarios' | 'parameters' | 'equations' | 'parameter-guide' | 'interventions'>('dashboard');
  
  // Count active AI interventions
  const activeInterventionsCount = Object.values(aiInterventions).filter(Boolean).length;
  
  // Listen for view-parameters event
  useEffect(() => {
    const handleViewParameters = () => {
      if (results) {
        setActiveTab('parameters');
      } else {
        setPreSimulationTab('parameters');
      }
    };
    
    window.addEventListener('view-parameters', handleViewParameters);
    
    return () => {
      window.removeEventListener('view-parameters', handleViewParameters);
    };
  }, [results]);
  
  // Listen for compare-scenarios event
  useEffect(() => {
    const handleCompareScenarios = () => {
      if (results) {
        setActiveTab('scenarios');
      } else {
        setPreSimulationTab('scenarios');
      }
    };
    
    window.addEventListener('compare-scenarios', handleCompareScenarios);
    
    return () => {
      window.removeEventListener('compare-scenarios', handleCompareScenarios);
    };
  }, [results]);
  
  // Listen for view-equations event
  useEffect(() => {
    const handleViewEquations = () => {
      if (results) {
        setActiveTab('equations');
      } else {
        setPreSimulationTab('equations');
      }
    };
    
    window.addEventListener('view-equations', handleViewEquations);
    
    return () => {
      window.removeEventListener('view-equations', handleViewEquations);
    };
  }, [results]);
  
  // Listen for view-interventions event
  useEffect(() => {
    const handleViewInterventions = () => {
      if (results) {
        setActiveTab('interventions');
      } else {
        setPreSimulationTab('interventions');
      }
    };
    
    window.addEventListener('view-interventions', handleViewInterventions);
    
    return () => {
      window.removeEventListener('view-interventions', handleViewInterventions);
    };
  }, [results]);
  
  // Listen for view-dashboard event
  useEffect(() => {
    const handleViewDashboard = () => {
      if (results) {
        setActiveTab('dashboard');
      } else {
        setPreSimulationTab('dashboard');
      }
    };
    
    window.addEventListener('view-dashboard', handleViewDashboard);
    
    return () => {
      window.removeEventListener('view-dashboard', handleViewDashboard);
    };
  }, [results]);
  
  const tabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'scenarios':
        return <ScenarioManager />;
      case 'interventions':
        return <AIInterventionManager />;
      case 'sensitivity':
        return <SensitivityAnalysis />;
      case 'parameters':
        return <ParametersPanel />;
      case 'equations':
        return <EquationExplainer />;
      case 'parameter-guide':
        return <ParameterGuide />;
      case 'ipm-bubble':
        return <BubbleChartView />;
      case 'impact-bubble':
        return <ImpactFeasibilityBubbleChart />;
      default:
        return <Dashboard />;
    }
  };
  
  const preSimulationContent = () => {
    switch(preSimulationTab) {
      case 'scenarios':
        return <ScenarioManager />;
      case 'parameters':
        return <ParametersPanel />;
      case 'equations':
        return <EquationExplainer />;
      case 'parameter-guide':
        return <ParameterGuide />;
      case 'interventions':
        return <AIInterventionManager />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <>
      <Head>
        <title>Stock-and-Flow Dashboard for AI in LMIC Health Systems</title>
        <meta name="description" content="A minimalist dashboard for modeling AI interventions in health systems." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Layout>
        <div className="pb-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Stock-and-Flow Dashboard for AI in LMIC Health Systems
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Model the impact of AI interventions on health outcomes, costs, and resource utilization
            </p>
            
            {results ? (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'dashboard', name: 'Dashboard' },
                    { id: 'scenarios', name: 'Scenarios' },
                    { 
                      id: 'interventions', 
                      name: 'AI Interventions',
                      badge: activeInterventionsCount > 0 ? activeInterventionsCount : undefined
                    },
                    { id: 'sensitivity', name: 'Sensitivity' },
                    { id: 'parameters', name: 'Parameters' },
                    { id: 'equations', name: 'Equations' },
                    { id: 'parameter-guide', name: 'Parameter Guide' },
                    { 
                      id: 'ipm-bubble', 
                      name: 'IPM Bubble Chart',
                      disabled: scenarios.length < 2,
                      tooltip: scenarios.length < 2 ? `Save ${2 - scenarios.length} more scenario${2 - scenarios.length > 1 ? 's' : ''} to compare` : undefined
                    },
                    { 
                      id: 'impact-bubble', 
                      name: 'Impact vs Feasibility',
                      disabled: scenarios.length < 2,
                      tooltip: scenarios.length < 2 ? `Save ${2 - scenarios.length} more scenario${2 - scenarios.length > 1 ? 's' : ''} to compare` : undefined
                    }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => !tab.disabled && setActiveTab(tab.id as TabType)}
                      className={`
                        border-b-2 py-4 px-1 text-sm font-medium relative
                        ${activeTab === tab.id 
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                          : tab.disabled
                          ? 'border-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
                      `}
                      disabled={tab.disabled}
                      title={tab.tooltip}
                    >
                      {tab.name}
                      {tab.badge && (
                        <span className="absolute top-2 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {tab.badge}
                        </span>
                      )}
                      {tab.disabled && (
                        <span className="absolute top-1 -right-2 bg-gray-400 dark:bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {scenarios.length}/2
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            ) : (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'dashboard', name: 'Dashboard' },
                    { id: 'scenarios', name: 'Scenarios' },
                    { id: 'parameters', name: 'Configure Parameters' },
                    { id: 'interventions', name: 'Configure AI Interventions' },
                    { id: 'equations', name: 'Model Equations' },
                    { id: 'parameter-guide', name: 'Parameter Guide' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPreSimulationTab(tab.id as 'dashboard' | 'scenarios' | 'parameters' | 'equations' | 'parameter-guide' | 'interventions')}
                      className={`
                        border-b-2 py-4 px-1 text-sm font-medium
                        ${preSimulationTab === tab.id 
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
                      `}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </header>
          
          <div className="space-y-8">
            {results ? tabContent() : preSimulationContent()}
          </div>
        </div>
      </Layout>
    </>
  );
} 