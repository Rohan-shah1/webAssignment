// Temporary in-memory storage for doctors
// Sample data populated to match the product proposal context

let doctors = [
    {
        id: "d1",
        name: "Dr. Alice Smith",
        specialization: "Cardiology",
        department: "Heart Center",
        availability: "Available",
        schedule: "Mon-Fri 09:00-17:00"
    },
    {
        id: "d2",
        name: "Dr. Bob Johnson",
        specialization: "Neurology",
        department: "Brain Institute",
        availability: "Busy",
        schedule: "Tue-Thu 10:00-14:00"
    }
];

module.exports = { doctors };
