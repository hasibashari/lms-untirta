import { User, Settings } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { ProfileSettings } from '../components/ProfileSettings';
import { PreferencesTab } from '../components/PreferencesTab';

const ProfilePage = () => {
  const {
    activeTab,
    handleTabChange,
    user,
    formData,
    handleChange,
    isSubmitting,
    isEditing,
    setIsEditing,
    handleSubmit,
    handleCancelEdit,
    settings,
    toggleSetting,
  } = useProfile();

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
            <ProfileSettings
              user={user}
              formData={formData}
              handleChange={handleChange}
              isSubmitting={isSubmitting}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleSubmit={handleSubmit}
              handleCancelEdit={handleCancelEdit}
            />
          )}

          {activeTab === 'settings' && (
            <PreferencesTab
              settings={settings}
              toggleSetting={toggleSetting}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
