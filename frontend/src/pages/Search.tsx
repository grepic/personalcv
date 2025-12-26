import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

interface SearchResult {
  userId: string;
  displayName: string;
  headline: string;
  avatarUrl: string | null;
  location: string | null;
  roles: string[];
  topSkills: { name: string }[];
  hasPortfolio: boolean;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [skill, setSkill] = useState(searchParams.get('skill') || '');
  const [isLookingForJob, setIsLookingForJob] = useState(searchParams.get('isLookingForJob') === 'true');
  const [isOfferingFreelance, setIsOfferingFreelance] = useState(searchParams.get('isOfferingFreelance') === 'true');

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (query) params.q = query;
      if (role) params.role = role;
      if (location) params.location = location;
      if (skill) params.skill = skill;
      if (isLookingForJob) params.isLookingForJob = 'true';
      if (isOfferingFreelance) params.isOfferingFreelance = 'true';

      const { data } = await api.get('/users/search', { params });
      setResults(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params: any = {};
    if (query) params.q = query;
    if (role) params.role = role;
    if (location) params.location = location;
    if (skill) params.skill = skill;
    if (isLookingForJob) params.isLookingForJob = 'true';
    if (isOfferingFreelance) params.isOfferingFreelance = 'true';

    setSearchParams(params);
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">Search Talent</h1>

        <div className="space-y-4">
          <input
            type="search"
            placeholder="Search by name, skills, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="CANDIDATE">Candidates</option>
              <option value="FREELANCER">Freelancers</option>
            </select>

            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="text"
              placeholder="Skill"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isLookingForJob}
                onChange={(e) => setIsLookingForJob(e.target.checked)}
                className="mr-2"
              />
              Looking for jobs
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isOfferingFreelance}
                onChange={(e) => setIsOfferingFreelance(e.target.checked)}
                className="mr-2"
              />
              Offering freelance services
            </label>
          </div>

          <button
            onClick={handleSearch}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {total > 0 && (
            <p className="text-gray-600 mb-4">{total} results found</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result) => (
              <Link
                key={result.userId}
                to={`/candidates/${result.userId}`}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {result.displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {result.displayName}
                    </h3>
                    {result.headline && (
                      <p className="text-gray-700 mb-2">{result.headline}</p>
                    )}
                    {result.location && (
                      <p className="text-sm text-gray-600 mb-2">{result.location}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-2">
                      {result.roles.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {r}
                        </span>
                      ))}
                    </div>

                    {result.topSkills && result.topSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {result.topSkills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {results.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              No results found. Try adjusting your search criteria.
            </div>
          )}
        </>
      )}
    </div>
  );
}
