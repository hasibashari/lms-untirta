import { Bell, Moon } from 'lucide-react';

export const PreferencesTab = ({ settings, toggleSetting }) => {
  return (
    <div className="space-y-6 w-full">
      <h3 className="text-lg font-medium text-slate-800 border-b border-slate-100 pb-4">
        Preferensi Aplikasi
      </h3>

      <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Bell size={20} />
          </div>
          <div>
            <h4 className="font-medium text-slate-800">Notifikasi Email</h4>
            <p className="text-sm text-slate-500">Terima pembaruan tentang tugas dan pengumuman.</p>
          </div>
        </div>
        <button
          onClick={() => toggleSetting('emailNotifications')}
          className={`w-12 h-6 rounded-full transition-colors relative ${settings.emailNotifications ? 'bg-blue-600' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.emailNotifications ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Moon size={20} />
          </div>
          <div>
            <h4 className="font-medium text-slate-800">Mode Gelap</h4>
            <p className="text-sm text-slate-500">Ubah tampilan aplikasi menjadi mode gelap.</p>
          </div>
        </div>
        <button
          onClick={() => toggleSetting('darkMode')}
          className={`w-12 h-6 rounded-full transition-colors relative ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.darkMode ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200 mt-6">
        <strong>Catatan:</strong> Fitur pengaturan saat ini hanya berupa tampilan untuk mendemonstrasikan preferensi UI.
      </div>
    </div>
  );
};
