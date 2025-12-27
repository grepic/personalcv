import React, { useState, useEffect } from 'react';
import { connectionsService, ConnectionStatus } from '../services/connections';

interface ConnectionButtonProps {
  userId: string;
  onConnectionChange?: () => void;
}

const ConnectionButton: React.FC<ConnectionButtonProps> = ({ userId, onConnectionChange }) => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConnectionStatus();
  }, [userId]);

  const fetchConnectionStatus = async () => {
    try {
      const data = await connectionsService.getConnectionStatus(userId);
      setStatus(data);
    } catch (error) {
      console.error('Error fetching connection status:', error);
    }
  };

  const handleConnect = async () => {
    if (showMessageInput) {
      // Send the request with message
      setLoading(true);
      try {
        await connectionsService.sendRequest(userId, message || undefined);
        await fetchConnectionStatus();
        setShowMessageInput(false);
        setMessage('');
        onConnectionChange?.();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to send connection request');
      } finally {
        setLoading(false);
      }
    } else {
      // Show message input
      setShowMessageInput(true);
    }
  };

  const handleAccept = async () => {
    if (!status?.connectionId) return;

    setLoading(true);
    try {
      await connectionsService.respondToRequest(status.connectionId, 'accept');
      await fetchConnectionStatus();
      onConnectionChange?.();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to accept connection');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!status?.connectionId) return;

    setLoading(true);
    try {
      await connectionsService.respondToRequest(status.connectionId, 'reject');
      await fetchConnectionStatus();
      onConnectionChange?.();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reject connection');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!status?.connectionId) return;

    if (!confirm('Are you sure you want to remove this connection?')) return;

    setLoading(true);
    try {
      await connectionsService.removeConnection(status.connectionId);
      await fetchConnectionStatus();
      onConnectionChange?.();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove connection');
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (status.status === 'self') {
    return null;
  }

  if (status.status === 'accepted') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          <span className="text-sm font-medium text-green-600">Connected</span>
        </div>
        <button
          onClick={handleRemove}
          disabled={loading}
          className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {loading ? 'Removing...' : 'Remove Connection'}
        </button>
      </div>
    );
  }

  if (status.status === 'pending') {
    if (status.isRequester) {
      // You sent the request
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Request Pending
        </div>
      );
    } else {
      // They sent you the request
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Accepting...' : 'Accept'}
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      );
    }
  }

  // No connection - show connect button
  return (
    <div className="space-y-2">
      {showMessageInput && (
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message (optional)"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
            <button
              onClick={() => {
                setShowMessageInput(false);
                setMessage('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {!showMessageInput && (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Connect
        </button>
      )}
    </div>
  );
};

export default ConnectionButton;
