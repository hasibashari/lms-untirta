import React from 'react';
import { Target, Flag } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            Tentang <span className="text-blue-600">SPADA UNTIRTA</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Sistem Pembelajaran Daring (SPADA) Universitas Sultan Ageng Tirtayasa merupakan platform pembelajaran digital yang dirancang untuk mendukung visi dan misi universitas dalam mencetak generasi unggul, berkarakter, dan berdaya saing global.
          </p>
        </div>

        {/* Vision & Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          
          {/* Vision */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target size={120} className="text-blue-600" />
            </div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-6">
              <Target size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Visi UNTIRTA</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              "Menjadi Universitas Terintegrasi, Smart and Green yang Unggul, Berkarakter dan Berdaya Saing Global di Tahun 2030."
            </p>
          </div>

          {/* Mission */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Flag size={120} className="text-orange-500" />
            </div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 mb-6">
              <Flag size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Misi UNTIRTA</h2>
            <ul className="text-slate-600 leading-relaxed space-y-3 list-disc list-inside">
              <li>Menyelenggarakan pendidikan, penelitian, dan pengabdian kepada masyarakat yang bermutu, relevan, dan berdaya saing.</li>
              <li>Menyelenggarakan tata kelola universitas yang baik (Good University Governance).</li>
              <li>Mengembangkan kerjasama institusi secara berkelanjutan.</li>
            </ul>
          </div>
        </div>

        {/* Core Values Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Nilai Dasar (Core Values)</h2>
          <p className="text-slate-600 mb-10 max-w-2xl mx-auto">
            Segenap sivitas akademika Untirta menjunjung tinggi nilai-nilai <span className="font-bold text-blue-600">JAWARA</span> dalam setiap aktivitas tridarma perguruan tinggi.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { letter: 'J', word: 'Jujur', color: 'bg-blue-50 text-blue-700' },
              { letter: 'A', word: 'Adil', color: 'bg-orange-50 text-orange-700' },
              { letter: 'W', word: 'Wibawa', color: 'bg-indigo-50 text-indigo-700' },
              { letter: 'A', word: 'Amanah', color: 'bg-emerald-50 text-emerald-700' },
              { letter: 'R', word: 'Religius', color: 'bg-purple-50 text-purple-700' },
              { letter: 'A', word: 'Akuntabel', color: 'bg-rose-50 text-rose-700' },
            ].map((value, idx) => (
              <div key={idx} className={`rounded-xl p-6 ${value.color} flex flex-col items-center justify-center shadow-sm border border-white/50`}>
                <span className="text-4xl font-black mb-2 opacity-80">{value.letter}</span>
                <span className="font-semibold">{value.word}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
