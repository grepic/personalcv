import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Role } from '../types';

export default function Onboarding() {
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [isLookingForJob, setIsLookingForJob] = useState(false);
  const [isOfferingFreelance, setIsOfferingFreelance] = useState(false);
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { updateUser } = useAuthStore();
  const navigate = useNavigate();

  const handleRoleToggle = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/users/onboarding', {
        roles: selectedRoles,
        isLookingForJob,
        isOfferingFreelance,
        headline: headline || undefined,
        location: location || undefined,
        companyName: selectedRoles.includes('COMPANY') ? companyName : undefined,
      });

      updateUser(data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
        <p className="text-gray-600 mb-8">Let's set up your profile</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am... (select all that apply)
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('CANDIDATE')}
                  onChange={() => handleRoleToggle('CANDIDATE')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Looking for a job</div>
                  <div className="text-sm text-gray-600">Full-time, part-time, or internships</div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('FREELANCER')}
                  onChange={() => handleRoleToggle('FREELANCER')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Offering freelance services</div>
                  <div className="text-sm text-gray-600">Self-employed, contractor, or freelancer</div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('COMPANY')}
                  onChange={() => handleRoleToggle('COMPANY')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Company / Recruiter</div>
                  <div className="text-sm text-gray-600">Posting jobs and hiring talent</div>
                </div>
              </label>
            </div>
          </div>

          {(selectedRoles.includes('CANDIDATE') || selectedRoles.includes('FREELANCER')) && (
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={isLookingForJob}
                  onChange={(e) => setIsLookingForJob(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium">I am actively looking for job opportunities</span>
              </label>

              {selectedRoles.includes('FREELANCER') && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isOfferingFreelance}
                    onChange={(e) => setIsOfferingFreelance(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">I am offering freelance services</span>
                </label>
              )}
            </div>
          )}

          <div>
            <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">
              Headline / Title
            </label>
            <input
              id="headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Senior Full-Stack Developer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Prague, Czech Republic"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {selectedRoles.includes('COMPANY') && (
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required={selectedRoles.includes('COMPANY')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Saving...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
}
