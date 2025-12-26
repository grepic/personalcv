import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Job } from '../types';
import { formatDistanceToNow } from 'date-fns';
import SaveJobButton from '../components/SaveJobButton';

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('');
  const [educationLevelFilter, setEducationLevelFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');
  const [postedWithinFilter, setPostedWithinFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [searchQuery, locationFilter, remoteOnly, experienceLevelFilter, educationLevelFilter, employmentTypeFilter, postedWithinFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      if (locationFilter) params.location = locationFilter;
      if (remoteOnly) params.remote = 'true';
      if (experienceLevelFilter) params.experienceLevel = experienceLevelFilter;
      if (educationLevelFilter) params.educationLevel = educationLevelFilter;
      if (employmentTypeFilter) params.employmentType = employmentTypeFilter;
      if (postedWithinFilter) params.postedWithin = postedWithinFilter;

      const { data } = await api.get('/jobs', { params });
      setJobs(data.jobs);
    } catch (error) {
      console.error('Load jobs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const JobCard = ({ job }: { job: Job }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition mb-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-blue-600">
            {job.company?.companyName?.charAt(0) || job.company?.displayName.charAt(0)}
          </span>
        </div>
        <Link to={`/jobs/${job.id}`} className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600">{job.title}</h3>
          <p className="text-gray-600 mb-2">
            {job.company?.companyName || job.company?.displayName}
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
            <span>{job.location}</span>
            {job.isRemote && <span className="text-green-600">Remote</span>}
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
              {job.employmentType.replace('_', ' ')}
            </span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
              {job.experienceLevel.replace('_', ' ')}
            </span>
          </div>
          {job.salaryMin && job.salaryMax && (
            <p className="text-gray-700 font-medium">
              ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} {job.currency}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
          </p>
        </Link>
        <div>
          <SaveJobButton jobId={job.id} variant="icon" />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Find Jobs</h2>

        <div className="space-y-4">
          <input
            type="search"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="mr-2"
              />
              <span>Remote only</span>
            </label>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            {showAdvancedFilters ? '▼' : '▶'} Advanced Filters
          </button>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <select
                  value={experienceLevelFilter}
                  onChange={(e) => setExperienceLevelFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="ENTRY_LEVEL">Entry Level</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="MID_LEVEL">Mid-Level</option>
                  <option value="SENIOR">Senior</option>
                  <option value="LEAD">Lead</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <select
                  value={educationLevelFilter}
                  onChange={(e) => setEducationLevelFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Education</option>
                  <option value="NOT_REQUIRED">Not Required</option>
                  <option value="HIGH_SCHOOL">High School</option>
                  <option value="VOCATIONAL">Vocational</option>
                  <option value="BACHELORS">Bachelor's</option>
                  <option value="MASTERS">Master's</option>
                  <option value="PHD">Ph.D.</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select
                  value={employmentTypeFilter}
                  onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posted Within</label>
                <select
                  value={postedWithinFilter}
                  onChange={(e) => setPostedWithinFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Time</option>
                  <option value="1">Last 24 hours</option>
                  <option value="3">Last 3 days</option>
                  <option value="7">Last week</option>
                  <option value="14">Last 2 weeks</option>
                  <option value="30">Last month</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          No jobs found
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">{jobs.length} jobs found</p>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
