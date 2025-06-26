import React, { useState } from 'react';
import { useQuery, gql } from '@apollo/client';

const GET_DOCTORS = gql`
  query GetDoctorsBySpecialty($specialty: String, $city: String) {
    getDoctorsBySpecialty(specialty: $specialty, city: $city) {
      id
      name
      specialty
      city
    }
  }
`;

export default function DoctorSearch() {
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');

  const { loading, error, data, refetch } = useQuery(GET_DOCTORS, {
    variables: { specialty, city },
    skip: !specialty && !city,
  });

  const handleSearch = () => {
    refetch({ specialty, city });
  };

  const specialties = [
    'Généraliste',
    'Cardiologue',
    'Dermatologue',
    'Gynécologue',
    'Pédiatre',
    'Psychiatre',
    'Ophtalmologue',
    'Dentiste'
  ];

  const cities = [
    'Tunis',
    'Sfax',
    'Sousse',
    'Monastir',
    'Hammamet',
    'Nabeul',
    'Gabès',
    'Gafsa'
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-4">🔍 Rechercher un médecin</h3>
      
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les spécialités</option>
          {specialties.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
        
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les villes</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Rechercher
        </button>
      </div>

      {loading && <p className="text-gray-600">Chargement...</p>}
      
      {error && <p className="text-red-500">Erreur: {error.message}</p>}
      
      {data && data.getDoctorsBySpecialty && (
        <div>
          <h4 className="text-lg font-semibold mb-3">
            Résultats ({data.getDoctorsBySpecialty.length} médecin(s))
          </h4>
          
          <div className="grid gap-4">
            {data.getDoctorsBySpecialty.map(doctor => (
              <div key={doctor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h5 className="font-semibold text-lg">{doctor.name}</h5>
                <p className="text-gray-600">{doctor.specialty}</p>
                <p className="text-gray-500">📍 {doctor.city}</p>
                <button className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm transition-colors">
                  Prendre RDV
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 