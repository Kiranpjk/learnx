import React, { useState, useEffect, useContext } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    bio: '',
    avatar: null
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/users/profile/');
      setProfile(res.data);
      setFormData({
        bio: res.data.bio || '',
        avatar: null // Don't pre-fill file input
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'avatar') {
      setFormData({ ...formData, avatar: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const data = new FormData();
    data.append('bio', formData.bio);
    if (formData.avatar) {
      data.append('avatar', formData.avatar);
    }

    try {
      const res = await axios.patch('/users/profile/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile(res.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-violet-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-violet-100 mt-1">Manage your account settings</p>
          </div>
          
          <div className="p-8">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6">{success}</div>}

            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar / Avatar */}
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-slate-200 overflow-hidden mb-4 border-4 border-white shadow-lg">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-slate-400 bg-slate-100">
                      {profile?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-800">{profile?.username}</h2>
                <p className="text-slate-500">{profile?.email}</p>
                <span className="mt-2 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                  {profile?.role}
                </span>
              </div>

              {/* Form */}
              <div className="w-full md:w-2/3">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      rows="4"
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      placeholder="Tell us a bit about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Change Avatar
                    </label>
                    <input
                      type="file"
                      name="avatar"
                      accept="image/*"
                      onChange={handleChange}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-violet-50 file:text-violet-700
                        hover:file:bg-violet-100
                      "
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="bg-violet-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-violet-700 transition-colors shadow-md shadow-violet-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

