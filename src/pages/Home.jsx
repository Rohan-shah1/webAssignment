import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorApi, authApi } from '../api/api';

function Home() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const data = await doctorApi.getAll();
      setDoctors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    window.location.reload();
  };

  return (
    <div>
      <header>
        <div className="container">
          <h1>Doctor Staff System</h1>
          <nav>
            <Link to="/">Home</Link>
            {!token ? (
              <Link to="/login">Login</Link>
            ) : (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Logout</a>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        <h2>Our Doctors</h2>
        {loading ? (
          <p>Loading doctors...</p>
        ) : (
          <div className="doctor-grid">
            {doctors.length === 0 ? (
              <p>No doctors found.</p>
            ) : (
              doctors.map((doctor) => (
                <div key={doctor._id} className="card">
                  <img
                    src={doctor.profilePic || 'https://via.placeholder.com/300x200?text=No+Photo'}
                    alt={doctor.name}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Photo'; }}
                  />
                  <div className="card-content">
                    <h3>{doctor.name}</h3>
                    <p><strong>{doctor.specialization}</strong></p>
                    <p>{doctor.department}</p>
                    <p>Schedule: {doctor.schedule || 'Not Set'}</p>
                    <span className={`status-badge status-${doctor.availability.toLowerCase().replace(' ', '-')}`}>
                      {doctor.availability}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;
