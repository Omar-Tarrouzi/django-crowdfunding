import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ProjectDetail = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { projectId } = useParams();

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/project/${projectId}/`);
        setProject(response.data);
      } catch (err) {
        setError(err.message);
        console.error('Error loading project:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const handleFavorite = async () => {
    try {
      const response = await axios.post(`http://localhost:8000/api/project/${projectId}/favorite/`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setProject(prev => ({ ...prev, is_favorite: response.data.is_favorite }));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDonate = async (amount) => {
    try {
      await axios.post(`http://localhost:8000/api/project/${projectId}/donate/`, 
        { montant: amount },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // Recharger les détails du projet
      const response = await axios.get(`http://localhost:8000/api/project/${projectId}/`);
      setProject(response.data);
    } catch (err) {
      console.error('Error making donation:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!project) return <div>No project found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {project.image && (
          <img 
            src={project.image} 
            alt={project.titre} 
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{project.titre}</h1>
          <p className="text-gray-600 mb-6">{project.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Goal</p>
              <p className="text-xl font-semibold">{project.montant_objectif} DH</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Raised</p>
              <p className="text-xl font-semibold">{project.montant_recolte} DH</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${project.avancement}%` }}
            ></div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleFavorite}
              className={`px-4 py-2 rounded ${
                project.is_favorite 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {project.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
            
            <button
              onClick={() => handleDonate(100)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Donate 100 DH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail; 