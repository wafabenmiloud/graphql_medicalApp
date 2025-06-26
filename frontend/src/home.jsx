import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  return (
    <div className="text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          🩺 HealthBook
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Application de gestion des rendez-vous médicaux avec Web Services GraphQL
        </p>
        
        {user ? (
          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Bienvenue, {user.name} !
            </h3>
            <p className="text-gray-600 mb-6">
              Vous êtes connecté en tant que {user.role}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            >
              Aller au Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-2xl font-semibold text-blue-600 mb-4">Fonctionnalités</h3>
                <ul className="text-left space-y-2 text-gray-700">
                  <li>• Inscription et connexion</li>
                  <li>• Gestion des rendez-vous</li>
                  <li>• Recherche de médecins</li>
                  <li>• API GraphQL</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-2xl font-semibold text-green-600 mb-4">Technologies</h3>
                <ul className="text-left space-y-2 text-gray-700">
                  <li>• Backend: Node.js + Apollo Server</li>
                  <li>• Frontend: React + Apollo Client</li>
                  <li>• Base de données: MongoDB</li>
                  <li>• Web Services: GraphQL</li>
                </ul>
              </div>
            </div>
            
            <div className="space-x-4">
              <Link 
                to="/register" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
              >
                Commencer
              </Link>
              <Link 
                to="/login" 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg text-lg font-semibold"
              >
                Se connecter
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
