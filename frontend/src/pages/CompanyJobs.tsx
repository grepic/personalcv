import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Job } from '../types';
import { formatDistanceToNow } from 'date-fns';

export default function CompanyJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data } = await api.get('/jobs');
      setJobs(data.jobs);
    } catch (error) {
      console.error('Load jobs error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            Post New Job
          </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          No jobs posted yet
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {job.title}
                  </Link>
                  <p className="text-gray-600 mt-1">
                    {job.location} {job.isRemote && '(Remote)'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded-md text-sm ${
                      job.status === 'OPEN'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {job.status}
                  </span>
                  <Link
                    to={`/applications/jobs/${job.id}/applications`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View Applications
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
