import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Settings, Save, Lock, Mail, Hash, Bell, Moon } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { updateProfile } from '../userService';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const { user, updateUserContext } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    nim: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Toggle state for Settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    darkMode: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        nim: user.nim || '',
      });
    }
  }, [user]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Remove empty password so we don't accidentally update it to empty
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }

      const response = await updateProfile(payload);
      updateUserContext(response.data);
      toast.success('Profil berhasil diperbarui');
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setIsSubmitting(false);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        nim: user.nim || '',
      });
    }
    setIsEditing(false);
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Pengaturan diperbarui');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan Akun</h1>
        <p className="text-slate-500">Kelola profil dan preferensi akun Anda</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative
              ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            <User size={18} />
            <span>Profil</span>
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => handleTabChange('settings')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative
              ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            <Settings size={18} />
            <span>Pengaturan</span>
            {activeTab === 'settings' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{user?.name || 'User'}</h3>
                    <p className="text-slate-500 text-sm mb-2">{user?.role || 'MAHASISWA'}</p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Edit Profil
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Masukkan email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">NIM / NIP</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        name="nim"
                        value={formData.nim}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Masukkan NIM atau NIP"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password Baru (Opsional)</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        minLength={8}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Kosongkan jika tidak ingin mengubah password"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2 md:col-span-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <Save size={18} />
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">Nama Lengkap</p>
                      <p className="font-medium text-slate-800">{user?.name || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">Email</p>
                      <p className="font-medium text-slate-800">{user?.email || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">NIM / NIP</p>
                      <p className="font-medium text-slate-800">{user?.nim || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">Role / Peran</p>
                      <p className="font-medium text-slate-800">{user?.role || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {activeTab === 'settings' && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
