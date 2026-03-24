const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const authApi = {
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },
  logout: () => {
    localStorage.clear();
  }
};

export const doctorApi = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/doctors`);
    if (!res.ok) throw new Error('Failed to fetch doctors');
    return await res.json();
  },
  getOne: async (id) => {
    const res = await fetch(`${API_BASE}/doctors/${id}`);
    if (!res.ok) throw new Error('Failed to fetch doctor');
    return await res.json();
  },
  save: async (id, formData) => {
    const url = id ? `${API_BASE}/doctors/${id}` : `${API_BASE}/doctors`;
    const method = id ? 'PUT' : 'POST';
    const token = localStorage.getItem('token');
    
    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Operation failed');
    return data;
  },
  delete: async (id) => {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error('Delete failed');
    return true;
  }
};

export const leaveApi = {
  apply: async (payload) => {
    const res = await fetch(`${API_BASE}/leave/apply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to apply for leave');
    return await res.json();
  },
  getMyLeaves: async () => {
    const res = await fetch(`${API_BASE}/leave/my-leaves`, {
      headers: getHeaders()
    });
    return await res.json();
  },
  getAllLeaves: async () => {
    const res = await fetch(`${API_BASE}/leave/all`, {
      headers: getHeaders()
    });
    return await res.json();
  },
  updateStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/leave/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return await res.json();
  }
};
