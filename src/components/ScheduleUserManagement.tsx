'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import skillDisplayNames, { formatSkill } from '@/lib/skills';
import { Schedule } from '../services/scheduleService';
import { User } from '../services/userService';
import { api } from '../services/api';

// Enumeração técnica das habilidades (usada no backend/DB)
enum Skill {
  VOCAL_LEAD = 'VOCAL_LEAD',
  BACKING_VOCAL = 'BACKING_VOCAL',
  VIOLAO = 'VIOLAO',
  SAX = 'SAX',
  GUITARRA = 'GUITARRA',
  TECLADO = 'TECLADO',
  CONTRA_BAIXO = 'CONTRA_BAIXO',
  BATERIA = 'BATERIA',
  MESA_SOM = 'MESA_SOM',
  OUTROS = 'OUTROS',
}

// Definição das propriedades que o componente recebe
interface ScheduleUserManagementProps {
  schedule: Schedule;
  allUsers: User[];
  onAddUser: (userId: number, skill: Skill) => void;
  onRemoveUser: (userId: number) => void;
}

export default function ScheduleUserManagement({ schedule, allUsers, onAddUser, onRemoveUser }: ScheduleUserManagementProps) {
  // Estados locais para gerenciar habilidades selecionadas e termos de busca
  const [userSkills, setUserSkills] = useState<{ [key: number]: Skill }>({});
  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');
  const [availableSearchTerm, setAvailableSearchTerm] = useState('');
  const [unifiedSearchTerm, setUnifiedSearchTerm] = useState('');

  // Divide os usuários em atribuídos e disponíveis
  const { assignedUsers, availableUsers } = useMemo(() => {
    const assignedUserIds = new Set(schedule.users.map(u => u.userId));
    const assigned = allUsers.filter(u => assignedUserIds.has(u.id));
    const available = allUsers.filter(u => !assignedUserIds.has(u.id));
    return { assignedUsers: assigned, availableUsers: available };
  }, [schedule, allUsers]);

  // Filtra a lista de usuários atribuídos com base no input de busca
  const filteredAssignedUsers = useMemo(() => {
    if (!assignedSearchTerm) return assignedUsers;
    return assignedUsers.filter(user =>
      user.name.toLowerCase().includes(assignedSearchTerm.toLowerCase())
    );
  }, [assignedUsers, assignedSearchTerm]);

  // Filtra a lista de usuários disponíveis com base no input de busca
  const filteredAvailableUsers = useMemo(() => {
    if (!availableSearchTerm) return availableUsers;
    return availableUsers.filter(user =>
      user.name.toLowerCase().includes(availableSearchTerm.toLowerCase())
    );
  }, [availableUsers, availableSearchTerm]);

  // Filtra a lista unificada de usuários para a visualização móvel
  const filteredUnifiedUsers = useMemo(() => {
    if (!unifiedSearchTerm) return allUsers;
    return allUsers.filter(user =>
      user.name.toLowerCase().includes(unifiedSearchTerm.toLowerCase())
    );
  }, [allUsers, unifiedSearchTerm]);

  // Mapeia as habilidades já atribuídas para acesso rápido
  const assignedUserSkills = useMemo(() => {
    const skillMap = new Map<number, Skill>();
    schedule.users.forEach(u => {
      skillMap.set(u.userId, u.skill as Skill);
    });
    return skillMap;
  }, [schedule.users]);

  // Conjunto de IDs de usuários atribuídos para verificações rápidas
  const assignedUserIds = useMemo(() => new Set(schedule.users.map(u => u.userId)), [schedule.users]);

  // Handlers de eventos
  const handleSkillChange = (userId: number, skill: Skill) => {
    setUserSkills(prev => ({ ...prev, [userId]: skill }));
  };

  const handleAddClick = (userId: number) => {
    const skill = userSkills[userId];
    if (skill) {
      onAddUser(userId, skill);
    }
  };

  return (
    <div className="h-full max-w-full">
      {/* Visualização Unificada para Telas Pequenas/Médias */}
      <div className="lg:hidden">
        <h4 className="font-semibold text-lg mb-2 text-gray-200">Gerenciar Usuários</h4>
        <input
          type="text"
          placeholder="Buscar usuário..."
          value={unifiedSearchTerm}
          onChange={(e) => setUnifiedSearchTerm(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {filteredUnifiedUsers.length > 0 ? filteredUnifiedUsers.map((user) => {
    const isAssigned = assignedUserIds.has(user.id);
    const skill = assignedUserSkills.get(user.id);
    const formattedSkill = skill ? `(${formatSkill(skill) || skill})` : '';

            return (
              <div key={user.id} className="flex flex-nowrap items-center justify-between gap-2 bg-gray-700 p-2 rounded-md">
                <div className="flex items-center min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white text-sm font-bold mr-2 flex-shrink-0">
                    {user.avatar ? (
                      <Image
                        className="w-full h-full object-cover"
                        src={`${api.defaults.baseURL}/files/${user.avatar}`}
                        alt="User avatar"
                        width={32}
                        height={32}
                      />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-gray-200 text-sm truncate" title={user.name}>{user.name}</span>
                    {isAssigned && skill && <span className="text-xs text-gray-400 truncate" title={formattedSkill}>{formattedSkill}</span>}
                  </div>
                </div>
                {isAssigned ? (
                  <button
                    onClick={() => onRemoveUser(user.id)}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex-shrink-0"
                  >
                    Remover
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={userSkills[user.id] || ''}
                      onChange={(e) => handleSkillChange(user.id, e.target.value as Skill)}
                      className="text-xs bg-gray-600 text-white p-1 rounded-md"
                    >
                      <option value="" disabled>Selecione</option>
                      {Object.values(Skill).map(skillValue => (
                        <option key={skillValue} value={skillValue}>{formatSkill(skillValue)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddClick(user.id)}
                      className={`text-xs px-2 py-1 rounded ${(!userSkills[user.id] || !user.active) ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                      disabled={!userSkills[user.id] || !user.active}
                      title={!user.active ? 'Usuário desativado' : (!userSkills[user.id] ? 'Selecione a habilidade' : 'Adicionar')}
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            );
          }) : <p className="text-sm text-gray-400">Nenhum usuário encontrado.</p>}
        </div>
      </div>

      {/* Visualização de Duas Colunas para Telas Grandes */}
      <div className="hidden lg:grid grid-cols-2 gap-10">
        {/* Coluna 1: Usuários Atribuídos */}
        <div>
          <h4 className="font-semibold text-lg mb-2 text-gray-200">Usuários Atribuídos</h4>
          <input
            type="text"
            placeholder="Buscar usuário atribuído..."
            value={assignedSearchTerm}
            onChange={(e) => setAssignedSearchTerm(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {filteredAssignedUsers.length > 0 ? filteredAssignedUsers.map((user) => {
              const skill = assignedUserSkills.get(user.id);
              const formattedSkill = skill ? `(${formatSkill(skill) || skill})` : '';

              return (
                <div key={user.id} className="flex flex-nowrap items-center justify-between gap-2 bg-gray-700 p-2 rounded-md">
                  <div className="flex items-center min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white text-sm font-bold mr-2 flex-shrink-0">
                      {user.avatar ? (
                        <Image
                          className="w-full h-full object-cover"
                          src={`${api.defaults.baseURL}/files/${user.avatar}`}
                          alt="User avatar"
                          width={32}
                          height={32}
                        />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-gray-200 text-sm truncate" title={user.name}>{user.name}</span>
                      {skill && <span className="text-xs text-gray-400 truncate" title={formattedSkill}>{formattedSkill}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveUser(user.id)}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex-shrink-0"
                  >
                    Remover
                  </button>
                </div>
              );
            }) : <p className="text-sm text-gray-400">Nenhum usuário atribuído encontrado.</p>}
          </div>
        </div>

        {/* Coluna 2: Usuários Disponíveis */}
        <div>
          <h4 className="font-semibold text-lg mb-2 text-gray-200">Usuários Disponíveis</h4>
          <input
            type="text"
            placeholder="Buscar usuário disponível..."
            value={availableSearchTerm}
            onChange={(e) => setAvailableSearchTerm(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {filteredAvailableUsers.length > 0 ? filteredAvailableUsers.map(user => (
              <div key={user.id} className="flex flex-nowrap items-center justify-between gap-2 bg-gray-700 p-2 rounded-md">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white text-sm font-bold mr-2 flex-shrink-0">
                    {user.avatar ? (
                      <Image
                        className="w-full h-full object-cover"
                        src={`${api.defaults.baseURL}/files/${user.avatar}`}
                        alt="User avatar"
                        width={32}
                        height={32} />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <span className="text-gray-200 truncate text-sm" title={user.name}>{user.name}</span>
                  {!user.active && (
                    <span className="ml-2 text-xs text-red-400 flex-shrink-0">(Desativado)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={userSkills[user.id] || ''}
                    onChange={(e) => handleSkillChange(user.id, e.target.value as Skill)}
                    className="text-xs bg-gray-600 text-white p-1 rounded-md"
                  >
                    <option value="" disabled>Selecione</option>
                    {Object.values(Skill).map(skillValue => (
                      <option key={skillValue} value={skillValue}>{formatSkill(skillValue)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAddClick(user.id)}
                    className={`text-xs px-2 py-1 rounded ${(!userSkills[user.id] || !user.active) ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                    disabled={!userSkills[user.id] || !user.active}
                    title={!user.active ? 'Usuário desativado — não pode ser adicionado' : (!userSkills[user.id] ? 'Selecione a habilidade' : 'Adicionar usuário à escala')}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )) : <p className="text-sm text-gray-400">Nenhum usuário disponível encontrado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Função utilitária para obter iniciais do nome
const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  } else if (parts.length > 1) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return '';
};
