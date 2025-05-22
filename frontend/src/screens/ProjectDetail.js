import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/projects/${projectId}/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProject(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      {/* Add more JSX to display other project fields */}
    </div>
  );
};

export default ProjectDetail; 