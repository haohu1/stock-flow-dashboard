import React from 'react';
import { useAtom } from 'jotai';
import {
  selectedCountryAtom,
  isUrbanSettingAtom,
  useCountrySpecificModelAtom,
  multiConditionModeAtom,
  multiConditionMortalityMultiplierAtom,
  multiConditionResolutionReductionAtom,
  multiConditionCareSeekingBoostAtom,
  selectedDiseasesAtom
} from '../lib/store';
import { countryProfiles } from '../models/countrySpecificModel';

export default function CountrySpecificPanel() {
  const [selectedCountry, setSelectedCountry] = useAtom(selectedCountryAtom);
  const [isUrban, setIsUrban] = useAtom(isUrbanSettingAtom);
  const [useCountrySpecific, setUseCountrySpecific] = useAtom(useCountrySpecificModelAtom);
  const [multiConditionMode, setMultiConditionMode] = useAtom(multiConditionModeAtom);
  const [mortalityMultiplier, setMortalityMultiplier] = useAtom(multiConditionMortalityMultiplierAtom);
  const [resolutionReduction, setResolutionReduction] = useAtom(multiConditionResolutionReductionAtom);
  const [careSeekingBoost, setCareSeekingBoost] = useAtom(multiConditionCareSeekingBoostAtom);
  const [selectedDiseases] = useAtom(selectedDiseasesAtom);

  const selectedCountryProfile = countryProfiles[selectedCountry];

  return (
    <div className="space-y-6">
      {/* Country-Specific Model Toggle */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Country-Specific Context</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useCountrySpecific}
              onChange={(e) => setUseCountrySpecific(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Use country-specific parameters</span>
          </label>
        </div>

        {useCountrySpecific && (
          <div className="space-y-4">
            {/* Country Selection */}
            <div>
              <label htmlFor="country-select" className="block text-sm font-medium text-gray-700 mb-2">
                Country Profile
              </label>
              <select
                id="country-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {Object.entries(countryProfiles).map(([key, profile]) => (
                  <option key={key} value={key}>
                    {profile.country} - {profile.diseaseProfile}
                  </option>
                ))}
              </select>
              {selectedCountryProfile && (
                <p className="mt-2 text-sm text-gray-600">{selectedCountryProfile.description}</p>
              )}
            </div>

            {/* Urban/Rural Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Setting</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="setting"
                    checked={isUrban}
                    onChange={() => setIsUrban(true)}
                    className="text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Urban ({selectedCountryProfile ? `${Math.round(selectedCountryProfile.urbanPopulationPct * 100)}%` : '52%'})
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="setting"
                    checked={!isUrban}
                    onChange={() => setIsUrban(false)}
                    className="text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Rural ({selectedCountryProfile ? `${Math.round(selectedCountryProfile.ruralPopulationPct * 100)}%` : '48%'})
                  </span>
                </label>
              </div>
            </div>

            {/* Country Profile Details */}
            {selectedCountryProfile && (
              <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-gray-50 rounded-md">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">GDP per capita:</span>
                  <span className="ml-2 text-gray-900">${selectedCountryProfile.gdpPerCapitaUSD.toLocaleString()}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Health expenditure:</span>
                  <span className="ml-2 text-gray-900">${selectedCountryProfile.healthExpenditurePerCapitaUSD}/capita</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Physician density:</span>
                  <span className="ml-2 text-gray-900">{selectedCountryProfile.physicianDensityPer1000}/1000</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Hospital beds:</span>
                  <span className="ml-2 text-gray-900">{selectedCountryProfile.hospitalBedsPer1000}/1000</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multi-Condition Modeling */}
      {selectedDiseases.length > 1 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Multi-Condition Modeling</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={multiConditionMode}
                onChange={(e) => setMultiConditionMode(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Enable co-morbidity effects</span>
            </label>
          </div>

          {multiConditionMode && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Adjust parameters to model the interaction effects when patients have multiple concurrent conditions.
                Selected conditions: {selectedDiseases.join(', ')}
              </p>

              {/* Mortality Multiplier */}
              <div>
                <label htmlFor="mortality-multiplier" className="block text-sm font-medium text-gray-700 mb-2">
                  Mortality Multiplier: {mortalityMultiplier.toFixed(2)}x
                </label>
                <input
                  id="mortality-multiplier"
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={mortalityMultiplier}
                  onChange={(e) => setMortalityMultiplier(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1.0x (no effect)</span>
                  <span>3.0x (triple mortality)</span>
                </div>
              </div>

              {/* Resolution Reduction */}
              <div>
                <label htmlFor="resolution-reduction" className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Rate Factor: {resolutionReduction.toFixed(2)}x
                </label>
                <input
                  id="resolution-reduction"
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={resolutionReduction}
                  onChange={(e) => setResolutionReduction(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x (50% slower)</span>
                  <span>1.0x (no effect)</span>
                </div>
              </div>

              {/* Care Seeking Boost */}
              <div>
                <label htmlFor="care-seeking-boost" className="block text-sm font-medium text-gray-700 mb-2">
                  Care Seeking Multiplier: {careSeekingBoost.toFixed(2)}x
                </label>
                <input
                  id="care-seeking-boost"
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.1"
                  value={careSeekingBoost}
                  onChange={(e) => setCareSeekingBoost(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.8x (less likely)</span>
                  <span>2.0x (much more likely)</span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Co-morbidity Effects</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Multiple conditions often increase mortality risk</li>
                  <li>• Treatment complexity can slow recovery times</li>
                  <li>• Patients with multiple symptoms are more likely to seek care</li>
                  <li>• Drug interactions and contraindications must be considered</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Country Comparison Insights */}
      {useCountrySpecific && selectedCountryProfile && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Country Insights</h3>
          <div className="space-y-2">
            {selectedCountry === 'nigeria' && (
              <>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                  <span className="text-sm text-gray-700">High burden of childhood infectious diseases (pneumonia, diarrhea)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                  <span className="text-sm text-gray-700">Weak primary care infrastructure, especially rural</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <span className="text-sm text-gray-700">AI self-care solutions may have high impact for low-acuity conditions</span>
                </div>
              </>
            )}
            {selectedCountry === 'kenya' && (
              <>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                  <span className="text-sm text-gray-700">High HIV/TB burden with co-infection challenges</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <span className="text-sm text-gray-700">Strong vertical disease programs for HIV/TB</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <span className="text-sm text-gray-700">AI triage may help integrate fragmented care systems</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}