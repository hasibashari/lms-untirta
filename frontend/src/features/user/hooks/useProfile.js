import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { updateProfile } from '../api/user.api';
import { toast } from 'react-hot-toast';

export const useProfile = () => {
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

  return {
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
  };
};
