import { useState, useEffect } from 'react';
import api from '../services/api';
import { FreelancerService } from '../types';

interface ServicesManagerProps {
  userId: string;
  isOwnProfile: boolean;
}

export default function ServicesManager({ userId, isOwnProfile }: ServicesManagerProps) {
  const [services, setServices] = useState<FreelancerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<FreelancerService | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadServices();
  }, [userId]);

  const loadServices = async () => {
    try {
      const { data } = await api.get(`/users/${userId}/services`);
      setServices(data.services);
    } catch (error) {
      console.error('Load services error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        name,
        description,
        price: parseFloat(price),
        currency,
        deliveryTime,
      };

      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload);
      } else {
        await api.post('/services', payload);
      }

      loadServices();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: FreelancerService) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description);
    setPrice(service.price.toString());
    setCurrency(service.currency);
    setDeliveryTime(service.deliveryTime);
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await api.delete(`/services/${serviceId}`);
      loadServices();
    } catch (error) {
      console.error('Delete service error:', error);
      alert('Failed to delete service');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCurrency('USD');
    setDeliveryTime('');
    setEditingService(null);
    setShowForm(false);
    setError('');
  };

  if (loading) {
    return <div className="text-center py-4">Loading services...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Freelance Services</h2>
        {isOwnProfile && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : 'Add Service'}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isOwnProfile && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Logo Design"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you'll deliver..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CZK">CZK</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Time *
            </label>
            <input
              type="text"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              placeholder="e.g., 3 days, 1 week"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {isOwnProfile ? 'No services yet. Add your first service!' : 'No services offered yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{service.name}</h3>
                {isOwnProfile && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-700 mb-3">{service.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-blue-600">
                  {service.price} {service.currency}
                </span>
                <span className="text-sm text-gray-600">{service.deliveryTime}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
