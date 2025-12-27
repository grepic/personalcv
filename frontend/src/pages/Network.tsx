import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { connectionsService, Connection, ConnectionRequest } from '../services/connections';

const Network: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'connections') {
        const data = await connectionsService.getMyConnections();
        setConnections(data);
      } else {
        const data = await connectionsService.getPendingRequests();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await connectionsService.respondToRequest(connectionId, 'accept');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to accept connection');
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await connectionsService.respondToRequest(connectionId, 'reject');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reject connection');
    }
  };

  const handleRemove = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;

    try {
      await connectionsService.removeConnection(connectionId);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove connection');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Network</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'connections'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'requests'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requests ({requests.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Connections List */}
            {activeTab === 'connections' && (
              <div className="space-y-4">
                {connections.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No connections yet</h3>
                    <p className="mt-1 text-gray-500">
                      Start building your network by connecting with professionals
                    </p>
                  </div>
                ) : (
                  connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="bg-white rounded-lg shadow-sm p-4 flex items-start justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4 flex-1">
                        {/* Avatar */}
                        <Link to={`/profile/${connection.user.id}`}>
                          {connection.user.avatarUrl ? (
                            <img
                              src={connection.user.avatarUrl}
                              alt={connection.user.displayName}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                              {connection.user.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Link>

                        {/* User Info */}
                        <div className="flex-1">
                          <Link
                            to={`/profile/${connection.user.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {connection.user.displayName}
                          </Link>
                          {connection.user.headline && (
                            <p className="text-gray-600 text-sm mt-1">{connection.user.headline}</p>
                          )}
                          {connection.user.location && (
                            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {connection.user.location}
                            </p>
                          )}
                          <p className="text-gray-400 text-xs mt-2">
                            Connected {new Date(connection.connectedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          to={`/messages?user=${connection.user.id}`}
                          className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                        >
                          Message
                        </Link>
                        <button
                          onClick={() => handleRemove(connection.id)}
                          className="px-3 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Connection Requests */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {requests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No pending requests</h3>
                    <p className="mt-1 text-gray-500">You have no connection requests at the moment</p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white rounded-lg shadow-sm p-4 flex items-start justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4 flex-1">
                        {/* Avatar */}
                        <Link to={`/profile/${request.requester.id}`}>
                          {request.requester.avatarUrl ? (
                            <img
                              src={request.requester.avatarUrl}
                              alt={request.requester.displayName}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                              {request.requester.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Link>

                        {/* User Info */}
                        <div className="flex-1">
                          <Link
                            to={`/profile/${request.requester.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {request.requester.displayName}
                          </Link>
                          {request.requester.headline && (
                            <p className="text-gray-600 text-sm mt-1">{request.requester.headline}</p>
                          )}
                          {request.message && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700 italic">"{request.message}"</p>
                            </div>
                          )}
                          <p className="text-gray-400 text-xs mt-2">
                            Sent {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Network;
