import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Job } from '../types';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import SaveJobButton from '../components/SaveJobButton';

export default function JobDetail() {
  const { jobId } = useParams();
  const { user } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadJob();
    checkIfApplied();
  }, [jobId]);

  const loadJob = async () => {
    try {
      const { data } = await api.get(`/jobs/${jobId}`);
      setJob(data.job);
    } catch (error) {
      console.error('Load job error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const { data } = await api.get('/applications/my-applications');
      const applied = data.applications.some((app: any) => app.jobId === jobId);
      setHasApplied(applied);
    } catch (error) {
      console.error('Check applied error:', error);
    }
  };

  const handleApply = async () => {
    if (!jobId) return;

    try {
      setApplying(true);
      await api.post(`/applications/jobs/${jobId}/apply`);
      setHasApplied(true);
      alert('Application submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!job) {
    return <div className="text-center py-8">Job not found</div>;
  }

  const canApply =
    user &&
    (user.roles.includes('CANDIDATE') || user.roles.includes('FREELANCER')) &&
    !hasApplied &&
    job.status === 'OPEN';

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
        <p className="text-xl text-gray-700 mb-4">
          {job.company?.companyName || job.company?.displayName}
        </p>
        <div className="flex flex-wrap gap-4 text-gray-600">
          <span>{job.location}</span>
          {job.isRemote && <span className="text-green-600">Remote</span>}
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded">
            {job.employmentType.replace('_', ' ')}
          </span>
        </div>
        {job.salaryMin && job.salaryMax && (
          <p className="text-lg font-semibold text-gray-900 mt-4">
            ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} {job.currency}
          </p>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        {canApply && (
          <button
            onClick={handleApply}
            disabled={applying}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {applying ? 'Applying...' : 'Apply Now'}
          </button>
        )}
        {jobId && <SaveJobButton jobId={jobId} />}
      </div>

      {hasApplied && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
          You have already applied to this job
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Job Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
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

      <div className="pt-6 border-t text-sm text-gray-500">
        Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
      </div>
    </div>
  );
}
