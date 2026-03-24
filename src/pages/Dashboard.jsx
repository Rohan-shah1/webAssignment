import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorApi, leaveApi, authApi } from '../api/api';

function Dashboard() {
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [doctors, setDoctors] = useState([]);
  const [adminLeaves, setAdminLeaves] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  // Form States
  const [formData, setFormData] = useState({
    name: '', specialization: '', username: '', password: '', 
    department: '', roomNumber: '', schedule: '', availability: 'Available'
  });

  // Leave Form States
  const [leaveData, setLeaveData] = useState({ reason: '', startDate: '', endDate: '' });

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    if (role === 'Admin') {
      loadAdminData();
    } else {
      loadStaffData();
    }
  }, [role]);

  const loadAdminData = async () => {
    try {
      const docs = await doctorApi.getAll();
      setDoctors(docs);
      const leaves = await leaveApi.getAllLeaves();
      setAdminLeaves(leaves);
    } catch (e) { console.error(e); }
  };

  const loadStaffData = async () => {
    try {
      const me = await doctorApi.getOne(userId);
      setMyProfile(me);
      const leaves = await leaveApi.getMyLeaves();
      setMyLeaves(leaves);
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  // --- Admin Logic ---
  const handleEditPrep = async (id) => {
    try {
      const d = await doctorApi.getOne(id);
      setFormData({
        name: d.name, specialization: d.specialization, username: d.username || '', 
        password: '', department: d.department || '', roomNumber: d.roomNumber || '', 
        schedule: d.schedule || '', availability: d.availability || 'Available'
      });
      setEditingId(id);
      setShowForm(true);
      window.scrollTo(0, 0);
    } catch (e) { alert("Failed to load details"); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await doctorApi.delete(id);
      loadAdminData();
    } catch (e) { alert("Delete failed"); }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        if (key === 'password' && !formData[key]) return;
        data.append(key, formData[key]);
    });
    const fileInput = document.getElementById('profilePic');
    if (fileInput.files[0]) data.append('profilePic', fileInput.files[0]);

    try {
      await doctorApi.save(editingId, data);
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', specialization: '', username: '', password: '', department: '', roomNumber: '', schedule: '', availability: 'Available' });
      loadAdminData();
    } catch (err) { alert(err.message); }
  };

  const handleUpdateLeaveStatus = async (id, status) => {
    try {
      await leaveApi.updateStatus(id, status);
      loadAdminData();
    } catch (e) { alert("Failed to update status"); }
  };

  // --- Staff Logic ---
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await leaveApi.apply(leaveData);
      setLeaveData({ reason: '', startDate: '', endDate: '' });
      loadStaffData();
    } catch (e) { alert("Failed to apply for leave"); }
  };

  return (
    <div>
      <header>
        <div className="container">
          <h1>Staff Dashboard</h1>
          <nav>
            <Link to="/">Home</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Logout</a>
          </nav>
        </div>
      </header>

      <main className="container">
        {role === 'Admin' ? (
          <div id="admin-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Manage Doctors</h2>
              <button 
                onClick={() => { setShowForm(!showForm); if(!showForm) { setEditingId(null); setFormData({name:'', specialization:'', username:'', password:'', department:'', roomNumber:'', schedule:'', availability:'Available'}); } }} 
                style={{ width: 'auto' }}
              >
                {showForm ? 'Cancel' : '+ Add New Doctor'}
              </button>
            </div>

            {showForm && (
              <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '12px', background: '#fff' }}>
                <h3>{editingId ? 'Edit Doctor' : 'Add Doctor'}</h3>
                <form onSubmit={handleFormSubmit}>
                  <div className="form-group">
                    <label>Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Specialization</label>
                    <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Password {editingId && '(Leave blank to keep)'}</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingId} />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Room Number</label>
                    <input type="text" value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Schedule</label>
                    <input type="text" value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Availability</label>
                    <select value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})}>
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Profile Picture</label>
                    <input type="file" id="profilePic" accept="image/*" />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit">Save Doctor</button>
                    <button type="button" onClick={() => setShowForm(false)} style={{ background: '#666' }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Photo</th><th>Name</th><th>Room</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(d => (
                  <tr key={d._id}>
                    <td><img src={d.profilePic || 'https://via.placeholder.com/50x50'} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} /></td>
                    <td>{d.name}</td>
                    <td>{d.roomNumber || 'N/A'}</td>
                    <td>{d.availability}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEditPrep(d._id)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(d._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 style={{ marginTop: '40px' }}>Leave Applications</h2>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Staff Name</th><th>Reason</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminLeaves.map(l => (
                  <tr key={l._id}>
                    <td>{l.staffId?.name || 'Unknown'}</td>
                    <td>{l.reason}</td>
                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td><b>{l.status}</b></td>
                    <td>
                      {l.status === 'Pending' ? (
                        <>
                          <button className="btn-edit" onClick={() => handleUpdateLeaveStatus(l._id, 'Approved')}>Approve</button>
                          <button className="btn-delete" onClick={() => handleUpdateLeaveStatus(l._id, 'Rejected')}>Reject</button>
                        </>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div id="staff-view">
            <h2>My Profile & Room</h2>
            {myProfile && (
              <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '12px', background: '#fff', display: 'flex', gap: '20px' }}>
                <img src={myProfile.profilePic || 'https://via.placeholder.com/100x100'} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h3>{myProfile.name}</h3>
                  <p><b>Spec:</b> {myProfile.specialization}</p>
                  <p><b>Room:</b> <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.2em' }}>{myProfile.roomNumber || 'Not Assigned'}</span></p>
                  <p><b>Schedule:</b> {myProfile.schedule || 'Not Assigned'}</p>
                </div>
              </div>
            )}

            <h2>Apply for Leave</h2>
            <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '12px', background: '#fff' }}>
              <form onSubmit={handleLeaveSubmit}>
                <div className="form-group">
                  <label>Reason</label>
                  <input type="text" value={leaveData.reason} onChange={e => setLeaveData({...leaveData, reason: e.target.value})} required />
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Start Date</label>
                    <input type="date" value={leaveData.startDate} onChange={e => setLeaveData({...leaveData, startDate: e.target.value})} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>End Date</label>
                    <input type="date" value={leaveData.endDate} onChange={e => setLeaveData({...leaveData, endDate: e.target.value})} required />
                  </div>
                </div>
                <button type="submit">Submit Leave Request</button>
              </form>
            </div>

            <h2>My Leave Applications</h2>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Reason</th><th>Start</th><th>End</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.map(l => (
                  <tr key={l._id}>
                    <td>{l.reason}</td>
                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td><b>{l.status}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
