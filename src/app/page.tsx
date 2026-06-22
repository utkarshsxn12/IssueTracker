'use client';

import { useState, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import Dashboard from '@/components/Dashboard';
import { ActivityRow } from '@/types/activity';

interface RecentFile {
  id: string;
  name: string;
  timestamp: number;
  data: ActivityRow[];
}

export default function Home() {
  const [data, setData] = useState<ActivityRow[] | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  // Load recent files from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentFiles');
    if (saved) {
      try {
        setRecentFiles(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent files', e);
      }
    }
  }, []);

  // Save file to recent files when loaded
  const handleDataLoaded = (newData: ActivityRow[], fileName?: string) => {
    const newFile: RecentFile = {
      id: Date.now().toString(),
      name: fileName || `File ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      data: newData,
    };

    const updatedFiles = [newFile, ...recentFiles].slice(0, 10); // Keep last 10 files
    setRecentFiles(updatedFiles);
    localStorage.setItem('recentFiles', JSON.stringify(updatedFiles));
    setData(newData);
  };

  const handleLoadRecent = (file: RecentFile) => {
    setData(file.data);
  };

  return data && data.length > 0 ? (
    <Dashboard 
      data={data} 
      onReset={() => setData(null)} 
    />
  ) : (
    <FileUploader 
      onDataLoaded={handleDataLoaded} 
      recentFiles={recentFiles}
      onLoadRecent={handleLoadRecent}
    />
  );
}
