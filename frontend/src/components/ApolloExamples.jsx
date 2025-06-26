import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

// ===== QUERIES =====
const GET_DOCTORS = gql`
  query GetDoctors($specialty: String, $city: String) {
    getDoctorsBySpecialty(specialty: $specialty, city: $city) {
      id
      name
      specialty
      city
    }
  }
`;

const GET_USER_APPOINTMENTS = gql`
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

const GET_AVAILABLE_SLOTS = gql`
  query GetAvailableSlots($doctorId: ID!, $date: String!) {
    getAvailableSlots(doctorId: $doctorId, date: $date) {
      time
      available
    }
  }
`;

// ===== MUTATIONS =====
const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterInput!) {
    registerUser(input: $input) {
      user {
        id
        name
        email
        role
      }
      token
    }
  }
`;

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        name
        email
        role
      }
      token
    }
  }
`;

const BOOK_APPOINTMENT = gql`
  mutation BookAppointment($patientId: ID!, $doctorId: ID!, $date: String!, $time: String!) {
    bookAppointment(patientId: $patientId, doctorId: $doctorId, date: $date, time: $time) {
      id
      date
      time
      status
    }
  }
`;

const CANCEL_APPOINTMENT = gql`
  mutation CancelAppointment($appointmentId: ID!) {
    cancelAppointment(appointmentId: $appointmentId)
  }
`;

// ===== COMPOSANTS D'EXEMPLE =====

// 1. Query simple avec filtres
function DoctorSearch() {
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_DOCTORS, {
    variables: { specialty, city },
    skip: !specialty && !city, // Skip si aucun critère
    fetchPolicy: 'cache-and-network',
  });

  const handleSearch = () => {
    refetch({ specialty, city });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">🔍 Recherche de médecins</h3>
      
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Spécialité"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Ville"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleSearch} 
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error.message}
        </div>
      )}
      
      {data?.getDoctorsBySpecialty && (
        <div className="grid gap-4">
          {data.getDoctorsBySpecialty.map(doctor => (
            <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold">{doctor.name}</h4>
              <p className="text-gray-600">{doctor.specialty}</p>
              <p className="text-gray-500">{doctor.city}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 2. Query conditionnelle avec variables
function UserAppointments({ userId }) {
  const { data, loading, error, refetch } = useQuery(GET_USER_APPOINTMENTS, {
    variables: { userId },
    skip: !userId,
    pollInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  if (!userId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        Veuillez vous connecter pour voir vos rendez-vous
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Chargement des rendez-vous...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <h3 className="font-semibold">Erreur de chargement</h3>
        <p>{error.message}</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">📅 Mes rendez-vous</h3>
        <button 
          onClick={() => refetch()}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Actualiser
        </button>
      </div>
      
      {data.getUserAppointments.length > 0 ? (
        <div className="grid gap-4">
          {data.getUserAppointments.map(appointment => (
            <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold">
                {appointment.date} à {appointment.time}
              </p>
              <p className="text-gray-600">
                Statut: <span className="capitalize">{appointment.status}</span>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          Aucun rendez-vous pour le moment
        </p>
      )}
    </div>
  );
}

// 3. Mutation simple avec gestion d'état
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [login, { loading, error, data }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      if (data?.login?.token) {
        localStorage.setItem('token', data.login.token);
        localStorage.setItem('user', JSON.stringify(data.login.user));
        console.log('Connexion réussie!');
      }
    },
    onError: (error) => {
      console.error('Erreur de connexion:', error);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ variables: { email, password } });
    } catch (err) {
      // Erreur déjà gérée par onError
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">🔐 Connexion</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="votre@email.com"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error.message}
          </div>
        )}

        {data?.login && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Connexion réussie! Bienvenue {data.login.user.name}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

// 4. Mutation avec refetchQueries
function AppointmentBooking({ patientId, doctorId }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [bookAppointment, { loading, error, data }] = useMutation(BOOK_APPOINTMENT, {
    refetchQueries: [
      { query: GET_USER_APPOINTMENTS, variables: { userId: patientId } }
    ],
    onCompleted: (data) => {
      if (data?.bookAppointment) {
        setSelectedDate('');
        setSelectedTime('');
        console.log('Rendez-vous réservé avec succès!');
      }
    }
  });

  const handleBooking = async () => {
    try {
      await bookAppointment({
        variables: {
          patientId,
          doctorId,
          date: selectedDate,
          time: selectedTime
        }
      });
    } catch (err) {
      // Erreur déjà gérée par onError
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">📅 Réservation de rendez-vous</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heure
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error.message}
          </div>
        )}

        {data?.bookAppointment && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Rendez-vous réservé pour le {data.bookAppointment.date} à {data.bookAppointment.time}
          </div>
        )}

        <button
          onClick={handleBooking}
          disabled={loading || !selectedDate || !selectedTime}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Réservation...' : 'Réserver le rendez-vous'}
        </button>
      </div>
    </div>
  );
}

// 5. Mutation avec mise à jour manuelle du cache
function AppointmentCancellation({ appointmentId, userId }) {
  const [cancelAppointment, { loading, error }] = useMutation(CANCEL_APPOINTMENT, {
    update: (cache, { data }) => {
      // Mise à jour manuelle du cache
      const existingAppointments = cache.readQuery({
        query: GET_USER_APPOINTMENTS,
        variables: { userId }
      });

      if (existingAppointments) {
        cache.writeQuery({
          query: GET_USER_APPOINTMENTS,
          variables: { userId },
          data: {
            getUserAppointments: existingAppointments.getUserAppointments.filter(
              appointment => appointment.id !== appointmentId
            )
          }
        });
      }
    }
  });

  const handleCancel = async () => {
    try {
      await cancelAppointment({ variables: { appointmentId } });
      console.log('Rendez-vous annulé avec succès!');
    } catch (err) {
      console.error('Erreur d\'annulation:', err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">❌ Annulation de rendez-vous</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error.message}
        </div>
      )}

      <button
        onClick={handleCancel}
        disabled={loading}
        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Annulation...' : 'Annuler le rendez-vous'}
      </button>
    </div>
  );
}

// Composant principal qui regroupe tous les exemples
export default function ApolloExamples() {
  const [activeTab, setActiveTab] = useState('search');
  const [userId, setUserId] = useState('test-user-id');

  const tabs = [
    { id: 'search', label: '🔍 Recherche', component: <DoctorSearch /> },
    { id: 'appointments', label: '📅 Rendez-vous', component: <UserAppointments userId={userId} /> },
    { id: 'login', label: '🔐 Connexion', component: <LoginForm /> },
    { id: 'booking', label: '📅 Réservation', component: <AppointmentBooking patientId={userId} doctorId="test-doctor-id" /> },
    { id: 'cancellation', label: '❌ Annulation', component: <AppointmentCancellation appointmentId="test-appointment-id" userId={userId} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">
          🚀 Exemples Apollo Client
        </h2>
        <p className="text-blue-700">
          Démonstration des différentes façons d'utiliser Apollo Client pour les queries et mutations GraphQL
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="min-h-[400px]">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">💡 Instructions</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Recherche:</strong> Testez les queries avec filtres</li>
          <li>• <strong>Rendez-vous:</strong> Voir les queries conditionnelles et le polling</li>
          <li>• <strong>Connexion:</strong> Testez les mutations avec callbacks</li>
          <li>• <strong>Réservation:</strong> Voir les mutations avec refetchQueries</li>
          <li>• <strong>Annulation:</strong> Testez la mise à jour manuelle du cache</li>
        </ul>
      </div>
    </div>
  );
} 