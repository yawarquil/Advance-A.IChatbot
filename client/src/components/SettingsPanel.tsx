import React from 'react';
import { X, Palette, Bot, Settings as SettingsIcon, History, Trash2 } from 'lucide-react';
import { Settings } from '../types/chat';
import { AIService } from '../services/aiService';
import VoiceSettings from './VoiceSettings';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onClearHistory: () => void;
  onExportData: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onClearHistory,
  onExportData,
}) => {
  const aiService = new AIService();
  const availableModels = aiService.getAvailableModels();

  const themes = [
    { key: 'light', name: 'Light', color: 'bg-white border-gray-300' },
    { key: 'dark', name: 'Black Dark', color: 'bg-black border-gray-600' },
    { key: 'blue', name: 'Ocean Blue', color: 'bg-blue-600 border-blue-500' },
    { key: 'purple', name: 'Royal Purple', color: 'bg-purple-600 border-purple-500' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Theme Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Palette className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => onSettingsChange({ theme: theme.key as Settings['theme'] })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.theme === theme.key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full mx-auto mb-1 ${theme.color}`} />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Model</label>
            </div>
            <select
              value={settings.aiModel}
              onChange={(e) => onSettingsChange({ aiModel: e.target.value as Settings['aiModel'] })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableModels.map((model) => (
                <option key={model.key} value={model.key}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Settings */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.voiceEnabled}
                onChange={(e) => onSettingsChange({ voiceEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="flex flex-col">
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable voice input and text-to-speech</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Requires microphone permissions</span>
              </div>
            </label>
            
            {settings.voiceEnabled && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <VoiceSettings
                  selectedVoice={settings.selectedVoice}
                  voiceSpeed={settings.voiceSpeed}
                  voicePitch={settings.voicePitch}
                  onVoiceChange={(voice) => onSettingsChange({ selectedVoice: voice })}
                  onSpeedChange={(speed) => onSettingsChange({ voiceSpeed: speed })}
                  onPitchChange={(pitch) => onSettingsChange({ voicePitch: pitch })}
                />
              </div>
            )}
          </div>

          {/* Other Settings */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.imageGeneration}
                onChange={(e) => onSettingsChange({ imageGeneration: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable AI image generation</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoScroll}
                onChange={(e) => onSettingsChange({ autoScroll: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto-scroll to new messages</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.persistHistory}
                onChange={(e) => onSettingsChange({ persistHistory: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Save chat history</span>
            </label>
          </div>

          {/* Data Management */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center space-x-2 mb-3">
              <History className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Management</label>
            </div>
            <div className="space-y-2">
              <button
                onClick={onExportData}
                className="w-full p-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Export chat history
              </button>
              <button
                onClick={onClearHistory}
                className="w-full p-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear all data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;