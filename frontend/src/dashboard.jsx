import React, { useEffect, useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useNavigate } from "react-router-dom";

const GET_APPOINTMENTS = gql`
  query GetUserAppointments($userId: ID!) {
    getUserAppointments(userId: $userId) {
      id
      date
      time
      doctorId
      patientId
      status
    }
  }
`;

const GET_DOCTORS = gql`
  query {
    getDoctorsBySpecialty {
      id
      name
      specialty
      city
    }
  }
`;

const CANCEL_APPOINTMENT = gql`
  mutation CancelAppointment($appointmentId: ID!) {
    cancelAppointment(appointmentId: $appointmentId)
  }
`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const { data: appointmentsData, refetch: refetchAppointments } = useQuery(GET_APPOINTMENTS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const { data: doctorsData } = useQuery(GET_DOCTORS);
  const [cancelAppointment] = useMutation(CANCEL_APPOINTMENT);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await cancelAppointment({ variables: { appointmentId } });
      refetchAppointments();
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
    }
  };

  if (!user) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Dashboard - HealthBook
        </h2>
        <p className="text-gray-600">
          Bienvenue, <span className="font-semibold">{user.name}</span> ({user.role})
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold mb-4">
          Mes rendez-vous
        </h3>
        
        {appointmentsData?.getUserAppointments?.length > 0 ? (
          <div className="grid gap-4">
            {appointmentsData.getUserAppointments.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      {appointment.date} à {appointment.time}
                    </p>
                    <p className="text-gray-600">
                      Statut: {appointment.status}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelAppointment(appointment.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Aucun rendez-vous pour le moment
          </p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold mb-4">
          Liste des médecins
        </h3>
        
        {doctorsData?.getDoctorsBySpecialty?.length > 0 ? (
          <div className="grid gap-4">
            {doctorsData.getDoctorsBySpecialty.map((doctor) => (
              <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold">{doctor.name}</h4>
                <p className="text-gray-600">{doctor.specialty}</p>
                <p className="text-gray-500">{doctor.city}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Aucun médecin disponible
          </p>
        )}
      </div>
    </div>
  );
}
