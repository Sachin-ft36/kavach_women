import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function ZeroFIR() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [firData, setFirData] = useState<any>(null);

  const generateFIR = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-fir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          victimName: "User",
          location: { lat: 28.6139, lng: 77.2090 },
          timestamp: new Date().toISOString()
        })
      });
      const data = await res.json();
      setFirData(data);
      toast.success("Zero-FIR Generated Successfully");
    } catch (error) {
      toast.error("Failed to generate FIR");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-green-600/20 rounded-2xl flex items-center justify-center">
          <FileText className="text-green-500" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Zero-FIR Protocol</h3>
          <p className="text-sm text-gray-400">Bypass local delays. Direct to Home Dept.</p>
        </div>
      </div>

      {!firData ? (
        <button
          onClick={generateFIR}
          disabled={isGenerating}
          className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isGenerating ? "GENERATING SECURE PDF..." : "GENERATE ZERO-FIR"}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-2xl flex items-center gap-4">
            <CheckCircle className="text-green-500" />
            <div>
              <p className="text-sm font-bold">FIR #{firData.firId}</p>
              <p className="text-[10px] text-green-200 uppercase tracking-widest">Digitally Signed & Timestamped</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="py-3 bg-white text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <Download size={16} />
              DOWNLOAD
            </button>
            <button className="py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <Shield size={16} />
              TRACK CASE
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
