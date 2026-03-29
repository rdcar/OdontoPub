import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { api } from '../../api';
import { Activity, Users, BookOpen, Clock } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // using public API for general stats is easier
    api.getStats().then(data => {
      setStats(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8">Carregando métricas...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Visão geral do OdontoPub</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Total Publicações</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-bold text-gray-900">{stats?.total_publicacoes || 0}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Total Professores</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-bold text-gray-900">{stats?.total_professores || 0}</span>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Eventos Qualis A</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-bold text-gray-900">
            {(stats?.qualis_distribution?.A1 || 0) + (stats?.qualis_distribution?.A2 || 0) + (stats?.qualis_distribution?.A3 || 0) + (stats?.qualis_distribution?.A4 || 0)}
          </span>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Anos Registrados</h3>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-bold text-gray-900">
            {stats?.available_years?.length || 0}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Top 10 Top Journals</h2>
            <ul className="text-sm">
                {stats?.top_journals && Object.entries(stats.top_journals).slice(0, 10).map(([k,v]) => (
                    <li key={k} className="flex justify-between py-2 border-b last:border-0 text-gray-600">
                        <span className="truncate max-w-[80%]">{k}</span>
                        <span className="font-bold text-gray-900">{v}</span>
                    </li>
                ))}
            </ul>
          </div>
      </div>
    </div>
  );
}
