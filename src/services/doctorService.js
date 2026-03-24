const { v4: uuidv4 } = require('uuid');
let { doctors } = require('../data/storage');

/**
 * Returns all doctors from storage
 */
const getAllDoctors = () => {
    return doctors;
};

/**
 * Finds a single doctor by their ID
 */
const getDoctorById = (id) => {
    return doctors.find(d => d.id === id);
};

/**
 * Creates a new doctor, assigns a UUID, and saves to storage
 */
const createDoctor = (doctorData) => {
    const { name, specialization, department, availability, schedule, profilePic } = doctorData;

    const newDoctor = {
        id: uuidv4(),
        name,
        specialization,
        department: department || 'General',
        availability: availability || 'Available',
        schedule: schedule || 'TBD',
        profilePic: profilePic || null
    };

    doctors.push(newDoctor);
    return newDoctor;
};

/**
 * Updates an existing doctor's details
 */
const updateDoctor = (id, updateData) => {
    const doctorIndex = doctors.findIndex(d => d.id === id);

    if (doctorIndex === -1) {
        return null;
    }

    const updatedDoctor = {
        ...doctors[doctorIndex],
        ...updateData // only update provided fields
    };

    doctors[doctorIndex] = updatedDoctor;
    return updatedDoctor;
};

/**
 * Deletes a doctor from storage
 */
const deleteDoctor = (id) => {
    const doctorIndex = doctors.findIndex(d => d.id === id);

    if (doctorIndex === -1) {
        return false;
    }

    doctors.splice(doctorIndex, 1);
    return true;
};

module.exports = {
    getAllDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor
};
