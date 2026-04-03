import React from 'react';
import { X, Shield, FileText, AlertTriangle } from 'lucide-react';
import { ViewState } from '../types';

interface LegalProps {
  view: ViewState;
  onClose: () => void;
}

const Legal: React.FC<LegalProps> = ({ view, onClose }) => {
  const isPrivacy = view === ViewState.LEGAL_PRIVACY;
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-gray-700 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-surface rounded-t-2xl z-10">
          <div className="flex items-center gap-2 text-white">
            {isPrivacy ? <Shield className="text-primary" /> : <FileText className="text-primary" />}
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X />
          </button>
        </div>

        <div className="p-8 overflow-y-auto text-gray-300 text-sm leading-relaxed space-y-6">
           <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
               <AlertTriangle className="text-yellow-500 shrink-0" />
               <div>
                   <h4 className="font-bold text-yellow-500 mb-1">Health & Safety Disclaimer</h4>
                   <p className="text-xs">FormForge AI provides biomechanical analysis for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or coaching. Users participate in physical activities at their own risk.</p>
               </div>
           </div>

           {isPrivacy ? (
               <>
                <Section title="1. Data Collection">
                    We collect video data and biometric markers strictly for the purpose of analyzing sports technique. Data processing occurs in real-time. Optional cloud storage retains your session history only if enabled in Settings.
                </Section>
                <Section title="2. AI Processing">
                    Your video feeds are processed by our advanced AI models. We do not use your personal video data to train our public models without your explicit consent.
                </Section>
                <Section title="3. User Rights">
                    You retain full ownership of your data. You may request deletion of your account and all associated data at any time via the Settings menu.
                </Section>
               </>
           ) : (
               <>
                <Section title="1. Acceptance of Terms">
                    By using FormForge AI, you agree to these terms. You must be at least 13 years old to use this service.
                </Section>
                <Section title="2. Usage License">
                    We grant you a personal, non-exclusive license to use the app for personal training and improvement. Commercial redistribution of our analysis engine is prohibited.
                </Section>
                <Section title="3. Liability Limitation">
                    FormForge AI is not liable for any injuries sustained while attempting techniques suggested by the AI. Always warm up and consult a professional coach for high-risk movements.
                </Section>
               </>
           )}
        </div>
        
        <div className="p-6 border-t border-gray-700 text-right">
            <button onClick={onClose} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div>
        <h3 className="text-white font-bold mb-2">{title}</h3>
        <p>{children}</p>
    </div>
);

export default Legal;