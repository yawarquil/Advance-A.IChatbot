import React from 'react';
import { Volume2, Play, Pause } from 'lucide-react';
import { VoiceService } from '../services/voiceService';

interface VoiceSettingsProps {
  selectedVoice: string;
  voiceSpeed: number;
  voicePitch: number;
  onVoiceChange: (voice: string) => void;
  onSpeedChange: (speed: number) => void;
  onPitchChange: (pitch: number) => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  selectedVoice,
  voiceSpeed,
  voicePitch,
  onVoiceChange,
  onSpeedChange,
  onPitchChange,
}) => {
  const voiceService = new VoiceService();
  const availableVoices = voiceService.getAvailableVoices();
  const [isTestPlaying, setIsTestPlaying] = React.useState(false);

  const testVoice = async () => {
    if (isTestPlaying) {
      voiceService.stopSpeaking();
      setIsTestPlaying(false);
      return;
    }

    try {
      setIsTestPlaying(true);
      await voiceService.speak("Hello! This is how I sound with the current voice settings.", {
        voiceName: selectedVoice,
        rate: voiceSpeed,
        pitch: voicePitch,
      });
      setIsTestPlaying(false);
    } catch (error) {
      console.error('Voice test error:', error);
      setIsTestPlaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-3">
        <Volume2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Voice Settings</label>
      </div>

      {/* Voice Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Voice ({availableVoices.length} available)
        </label>
        <select
          value={selectedVoice || ""}
          onChange={(e) => onVoiceChange(e.target.value)}
          className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Default System Voice</option>
          {availableVoices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.gender}) - {voice.lang}
            </option>
          ))}
        </select>
      </div>

      {/* Speed Control */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Speed: {voiceSpeed.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={voiceSpeed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Slow</span>
          <span>Normal</span>
          <span>Fast</span>
        </div>
      </div>

      {/* Pitch Control */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Pitch: {voicePitch.toFixed(1)}
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={voicePitch}
          onChange={(e) => onPitchChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low</span>
          <span>Normal</span>
          <span>High</span>
        </div>
      </div>

      {/* Test Voice Button */}
      <button
        onClick={testVoice}
        className="w-full flex items-center justify-center space-x-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
      >
        {isTestPlaying ? (
          <>
            <Pause className="h-4 w-4" />
            <span>Stop Test</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            <span>Test Voice</span>
          </>
        )}
      </button>
    </div>
  );
};

export default VoiceSettings;