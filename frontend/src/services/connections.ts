import api from './api';

export interface Connection {
  id: string;
  user: {
    id: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
    location: string | null;
    roles: string[];
  };
  connectedAt: Date;
}

export interface ConnectionRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message: string | null;
  createdAt: Date;
  requester: {
    id: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
    location: string | null;
    roles: string[];
  };
}

export interface ConnectionStatus {
  status: 'none' | 'pending' | 'accepted' | 'rejected' | 'self';
  connectionId?: string;
  isRequester?: boolean;
}

export const connectionsService = {
  // Send a connection request
  sendRequest: async (addresseeId: string, message?: string) => {
    const response = await api.post('/connections/request', { addresseeId, message });
    return response.data;
  },

  // Respond to a connection request
  respondToRequest: async (connectionId: string, action: 'accept' | 'reject') => {
    const response = await api.post(`/connections/${connectionId}/respond`, { action });
    return response.data;
  },

  // Get my connections
  getMyConnections: async (): Promise<Connection[]> => {
    const response = await api.get('/connections/my-connections');
    return response.data;
  },

  // Get pending connection requests
  getPendingRequests: async (): Promise<ConnectionRequest[]> => {
    const response = await api.get('/connections/pending');
    return response.data;
  },

  // Remove a connection
  removeConnection: async (connectionId: string) => {
    const response = await api.delete(`/connections/${connectionId}`);
    return response.data;
  },

  // Get connection status with a specific user
  getConnectionStatus: async (userId: string): Promise<ConnectionStatus> => {
    const response = await api.get(`/connections/status/${userId}`);
    return response.data;
  },
};
