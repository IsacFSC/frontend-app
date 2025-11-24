'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Schedule } from '../services/scheduleService';
import { User } from '../services/userService';
import { api } from '../services/api';

enum Skill {
  VOCAL_LEAD = 'VOZ PRINCIPAL',
  BACKING_VOCAL = 'VOZ DE APOIO',
  VIOLAO = 'VIOLAO',
  SAX = 'SAX',
  GUITARRA = 'GUITARRA',
  TECLADO = 'TECLADO',
  CONTRA_BAIXO = 'CONTRA-BAIXO',
  BATERIA = 'BATERIA',
  OUTROS = 'OUTROS',
}

interface ScheduleUserManagementProps {
  schedule: Schedule;
  allUsers: User[];
  onAddUser: (userId: number, skill: Skill) => void;
  onRemoveUser: (userId: number) => void;
}

export default function ScheduleUserManagement({ schedule, allUsers, onAddUser, onRemoveUser }: ScheduleUserManagementProps) {
  const [userSkills, setUserSkills] = useState<{ [key: number]: Skill }>({});

  const { assignedUsers, availableUsers } = useMemo(() => {
    const assignedUserIds = new Set(schedule.users.map(u => u.userId));
    const assigned = allUsers.filter(u => assignedUserIds.has(u.id));
    const available = allUsers.filter(u => !assignedUserIds.has(u.id));
    return { assignedUsers: assigned, availableUsers: available };
  }, [schedule, allUsers]);

  const assignedUserSkills = useMemo(() => {
    const skillMap = new Map<number, Skill>();
    schedule.users.forEach(u => {
      skillMap.set(u.userId, u.skill as Skill);
    });
    return skillMap;
  }, [schedule.users]);

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
    <div className="grid grid-cols-1 gap-6">
      {/* Assigned Users */}
      <div>
        <h4 className="font-semibold text-lg mb-2 text-gray-200">Usuários Atribuídos</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {assignedUsers.length > 0 ? assignedUsers.map(user => {
            const skill = assignedUserSkills.get(user.id);
            const formattedSkill = skill ? `(${skill.replace(/_/g, ' ')})` : '';

            return (
              <div key={user.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white text-sm font-bold mr-2">
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
                  <span className="text-gray-200">{user.name}</span>
                  {skill && <span className="text-xs text-gray-400 ml-2">{formattedSkill}</span>}
                </div>
                <button
                  onClick={() => onRemoveUser(user.id)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Remover
                </button>
              </div>
            );
          }) : <p className="text-sm text-gray-400">Nenhum usuário atribuído.</p>}
        </div>
      </div>

      {/* Available Users */}
      <div>
        <h4 className="font-semibold text-lg mb-2 text-gray-200">Usuários Disponíveis</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {availableUsers.length > 0 ? availableUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white text-sm font-bold mr-2">
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
                <span className="text-gray-200">{user.name}</span>
                {!user.active && (
                  <span className="ml-2 text-xs text-red-400">(Desativado)</span>
                )}
              </div>
              <div className="flex items-center">
                <select
                  value={userSkills[user.id] || ''}
                  onChange={(e) => handleSkillChange(user.id, e.target.value as Skill)}
                  className="text-xs bg-gray-600 text-white p-1 rounded-md mr-2"
                >
                  <option value="" disabled>Selecione a habilidade</option>
                  {Object.values(Skill).map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
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
          )) : <p className="text-sm text-gray-400">Nenhum usuário disponível para adicionar.</p>}
        </div>
      </div>
    </div>
  );
}

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  } else if (parts.length > 1) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return '';
};