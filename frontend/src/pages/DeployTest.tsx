import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Activity, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeployTest() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [sensors, setSensors] = useState({
    pressure: 45.0,
    vibration: 5.2,
    flow_rate: 50.0,
    humidity: 60.0,
    temperature: 25.0,
    pipe_velocity: 1.5,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSensors({ ...sensors, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handlePredict = async () => {
    if (!file) {
      setError("Please upload an acoustic WAV file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('audio_file', file);
    formData.append('pressure', sensors.pressure.toString());
    formData.append('vibration', sensors.vibration.toString());
    formData.append('flow_rate', sensors.flow_rate.toString());
    formData.append('humidity', sensors.humidity.toString());
    formData.append('temperature', sensors.temperature.toString());
    formData.append('pipe_velocity', sensors.pipe_velocity.toString());

    try {
      // Points to /api/predict which is proxied or routed on Vercel
      const response = await axios.post('/api/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to get prediction from Vercel AI Backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Vercel <span className="text-cyan-400">AI</span> Leak Detector
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          Deployable Hybrid Multimodal Pipeline: Acoustic + IoT Sensor Fusion
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="glass p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Sensor Telemetry
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(sensors).map((key) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">{key.replace('_', ' ')}</label>
                  <input
                    type="number"
                    name={key}
                    value={(sensors as any)[key]}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-fuchsia-400" />
              Acoustic Sample
            </h2>
            <div className="relative group">
              <input
                type="file"
                accept=".wav"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${file ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 group-hover:border-white/20'}`}>
                <Upload className={`w-8 h-8 mx-auto mb-2 ${file ? 'text-cyan-400' : 'text-slate-500'}`} />
                <p className="text-sm text-slate-400">
                  {file ? file.name : "Drop .WAV file here or click to browse"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-cyan-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run Hybrid Inference"}
          </button>
        </div>

        {/* Results Panel */}
        <div className="flex flex-col justify-center">
          <AnimatePresence mode='wait'>
            {loading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-4"
              >
                <div className="w-20 h-20 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto" />
                <p className="text-slate-400 font-medium">Analyzing Multimodal Data...</p>
              </motion.div>
            )}

            {!loading && result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-8 rounded-3xl border ${result.prediction === 'LEAK' ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  {result.prediction === 'LEAK' ? 
                    <AlertCircle className="w-10 h-10 text-red-500" /> : 
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  }
                  <div>
                    <h3 className="text-2xl font-bold text-white">{result.prediction}</h3>
                    <p className="text-slate-400">AI Confidence: {result.confidence}%</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 uppercase mb-2">Leak Probability</p>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.leak_probability * 100}%` }}
                        className={`h-full ${result.prediction === 'LEAK' ? 'bg-red-500' : 'bg-green-500'}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {!loading && error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center"
              >
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>{error}</p>
              </motion.div>
            )}

            {!loading && !result && !error && (
              <div className="text-center p-12 border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-slate-500">Ready for Multimodal Analysis</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
