
import React from 'react';
import { Shield, Cpu, Users, Globe, CheckCircle } from 'lucide-react';
import { t } from '../utils/translations';

const About: React.FC<{lang?: string}> = ({ lang = 'English' }) => {
  return (
    <div className="p-8 pb-24 max-w-5xl mx-auto animate-fade-in text-gray-300">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          {t('redefining', lang)} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{t('human_potential', lang)}</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto leading-relaxed">
          {t('about_desc', lang)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <FeatureCard 
          icon={Cpu}
          title={t('adv_ai_core', lang)}
          desc={t('core_desc', lang)}
        />
        <FeatureCard 
          icon={Shield}
          title={t('injury_prev', lang)}
          desc={t('prev_desc', lang)}
        />
        <FeatureCard 
          icon={Globe}
          title={t('univ_access', lang)}
          desc={t('access_desc', lang)}
        />
      </div>

      <div className="bg-surface border border-gray-800 rounded-3xl p-8 md:p-12 mb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-6">{t('how_it_works', lang)}</h2>
          <div className="space-y-6">
            <Step number="01" title={t('step_capture', lang)} desc={t('step_capture_desc', lang)} />
            <Step number="02" title={t('step_analyze', lang)} desc={t('step_analyze_desc', lang)} />
            <Step number="03" title={t('step_coach', lang)} desc={t('step_coach_desc', lang)} />
          </div>
        </div>
      </div>

      <div className="text-center py-8">
        <h2 className="text-xl font-bold text-primary tracking-widest uppercase">{t('supported_by', lang)}</h2>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="bg-surface p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors">
    <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-4 text-white">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-sm leading-relaxed text-gray-400">{desc}</p>
  </div>
);

const Step = ({ number, title, desc }: any) => (
  <div className="flex gap-6 items-start">
    <span className="text-4xl font-bold text-gray-800">{number}</span>
    <div>
      <h4 className="text-lg font-bold text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  </div>
);

export default About;
