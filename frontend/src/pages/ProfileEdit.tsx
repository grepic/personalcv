import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { UserProfile, Experience, Education, UserSkill } from '../types';

export default function ProfileEdit() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Basic info
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [about, setAbout] = useState('');

  // Form modes
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await api.get(`/users/profile/${user?.id}`);
      setProfile(data.user);
      setDisplayName(data.user.displayName || '');
      setHeadline(data.user.headline || '');
      setLocation(data.user.location || '');
      setAbout(data.user.about || '');
    } catch (err) {
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    setError('');
    setSaving(true);

    try {
      const { data } = await api.put('/users/profile', {
        displayName,
        headline,
        location,
        about,
      });

      updateUser(data.user);
      alert('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (skillName: string) => {
    try {
      await api.post('/users/skills', { name: skillName });
      loadProfile();
      setShowAddSkill(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (!confirm('Remove this skill?')) return;

    try {
      await api.delete(`/users/skills/${skillId}`);
      loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove skill');
    }
  };

  const handleAddExperience = async (data: any) => {
    try {
      await api.post('/users/experience', data);
      loadProfile();
      setShowAddExperience(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add experience');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('Delete this experience?')) return;

    try {
      await api.delete(`/users/experience/${id}`);
      loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete experience');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <button
            onClick={() => navigate(`/profile/${user?.id}`)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            View Profile
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Senior Full-Stack Developer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Prague, Czech Republic"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {user?.roles.includes('COMPANY') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                About
              </label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            onClick={handleSaveBasicInfo}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Basic Info'}
          </button>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Skills</h2>
          <button
            onClick={() => setShowAddSkill(!showAddSkill)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showAddSkill ? 'Cancel' : 'Add Skill'}
          </button>
        </div>

        {showAddSkill && (
          <AddSkillForm onAdd={handleAddSkill} onCancel={() => setShowAddSkill(false)} />
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {profile?.skills?.map((skill) => (
            <div
              key={skill.id}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md flex items-center gap-2"
            >
              <span>{skill.name}</span>
              <button
                onClick={() => handleRemoveSkill(skill.id)}
                className="text-red-600 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Experience</h2>
          <button
            onClick={() => setShowAddExperience(!showAddExperience)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showAddExperience ? 'Cancel' : 'Add Experience'}
          </button>
        </div>

        {showAddExperience && (
          <AddExperienceForm
            onAdd={handleAddExperience}
            onCancel={() => setShowAddExperience(false)}
          />
        )}

        <div className="space-y-4 mt-4">
          {profile?.experience?.map((exp) => (
            <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{exp.title}</h3>
                  <p className="text-gray-700">{exp.companyName}</p>
                  <p className="text-sm text-gray-600">{exp.location}</p>
                </div>
                <button
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Add Skill Form
function AddSkillForm({ onAdd, onCancel }: { onAdd: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Skill name..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
      >
        Cancel
      </button>
    </form>
  );
}

// Add Experience Form
function AddExperienceForm({ onAdd, onCancel }: { onAdd: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
      <input
        type="text"
        placeholder="Job Title *"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="Company Name *"
        value={formData.companyName}
        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="Location"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          placeholder="Start Date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          placeholder="End Date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          disabled={formData.isCurrent}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={formData.isCurrent}
          onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked, endDate: '' })}
          className="mr-2"
        />
        I currently work here
      </label>
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
        >
          Add Experience
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
