import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import SensitivityAnalysis from '../components/SensitivityAnalysis';
import ParametersPanel from '../components/ParametersPanel';
import EquationExplainer from '../components/EquationExplainer';
import ScenarioManager from '../components/ScenarioManager';
import AIInterventionManager from '../components/AIInterventionManager';
import { useAtom } from 'jotai';
import { simulationResultsAtom, aiInterventionsAtom } from '../lib/store';

type TabType = 'dashboard' | 'scenarios' | 'interventions' | 'sensitivity' | 'parameters' | 'equations';

export default function Home() {
  const [results] = useAtom(simulationResultsAtom);
  const [aiInterventions] = useAtom(aiInterventionsAtom);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Count active AI interventions
  const activeInterventionsCount = Object.values(aiInterventions).filter(Boolean).length;
  
  // Listen for view-parameters event
  useEffect(() => {
    const handleViewParameters = () => {
      setActiveTab('parameters');
    };
    
    window.addEventListener('view-parameters', handleViewParameters);
    
    return () => {
      window.removeEventListener('view-parameters', handleViewParameters);
    };
  }, []);
  
  // Listen for compare-scenarios event
  useEffect(() => {
    const handleCompareScenarios = () => {
      // This would open a scenario comparison view
      setActiveTab('scenarios');
    };
    
    window.addEventListener('compare-scenarios', handleCompareScenarios);
    
    return () => {
      window.removeEventListener('compare-scenarios', handleCompareScenarios);
    };
  }, []);
  
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
            
            {results && (
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
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`
                        border-b-2 py-4 px-1 text-sm font-medium relative
                        ${activeTab === tab.id 
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
                      `}
                    >
                      {tab.name}
                      {tab.badge && (
                        <span className="absolute top-2 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </header>
          
          <div className="space-y-8">
            {results ? (
              tabContent()
            ) : (
              <Dashboard />
            )}
          </div>
        </div>
      </Layout>
    </>
  );
} 