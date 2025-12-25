import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { UserProfile } from '../types';
import { format } from 'date-fns';

export default function Profile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data } = await api.get(`/users/profile/${userId}`);
      setProfile(data.user);
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!profile) {
    return <div className="text-center py-8">Profile not found</div>;
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM yyyy');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{profile.displayName}</h1>
            {profile.headline && (
              <p className="text-xl text-gray-700 mb-2">{profile.headline}</p>
            )}
            {profile.location && (
              <p className="text-gray-600">{profile.location}</p>
            )}
            <div className="flex gap-2 mt-3">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* About (for companies) */}
      {profile.about && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-3">About</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{profile.about}</p>
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
            >
              {profile.websiteUrl}
            </a>
          )}
        </div>
      )}

      {/* Experience */}
      {profile.experience && profile.experience.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Experience</h2>
          <div className="space-y-6">
            {profile.experience.map((exp) => (
              <div key={exp.id}>
                <h3 className="text-lg font-semibold">{exp.title}</h3>
                <p className="text-gray-700">{exp.companyName}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(exp.startDate)} -{' '}
                  {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : 'N/A'}
                </p>
                {exp.location && <p className="text-sm text-gray-600">{exp.location}</p>}
                {exp.description && (
                  <p className="text-gray-700 mt-2 whitespace-pre-wrap">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Education</h2>
          <div className="space-y-4">
            {profile.education.map((edu) => (
              <div key={edu.id}>
                <h3 className="text-lg font-semibold">{edu.school}</h3>
                <p className="text-gray-700">
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill.id}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Freelancer Services */}
      {profile.services && profile.services.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.services.map((service) => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                <p className="text-gray-700 mb-3">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-blue-600">
                    ${service.price} {service.currency}
                  </span>
                  <span className="text-sm text-gray-600">{service.deliveryTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Projects */}
      {profile.portfolioProjects && profile.portfolioProjects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
          <div className="space-y-6">
            {profile.portfolioProjects.map((project) => (
              <div key={project.id}>
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="text-gray-700 mt-2">{project.description}</p>
                {project.externalUrl && (
                  <a
                    href={project.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
                  >
                    View Project →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
