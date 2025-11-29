'use client';

import Image from 'next/image';
import { useMemo, useState, useEffect, Suspense, useCallback } from 'react';
import { Schedule, getScheduleById, addUserToSchedule, removeUserFromSchedule } from '../../../../services/scheduleService';
import { User} from '@/services/userService';
import { getUsers } from '../../../../services/userService';
import { api } from '../../../../services/api';
import { useSearchParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { FaArrowLeft } from 'react-icons/fa';


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

// Mapeamento para exibir os nomes em português no frontend
const skillDisplayNames: { [key in Skill]: string } = {
  [Skill.VOCAL_LEAD]: 'VOZ PRINCIPAL',
  [Skill.BACKING_VOCAL]: 'VOZ DE APOIO',
  [Skill.VIOLAO]: 'VIOLÃO',
  [Skill.SAX]: 'SAX',
  [Skill.GUITARRA]: 'GUITARRA',
  [Skill.TECLADO]: 'TECLADO',
  [Skill.CONTRA_BAIXO]: 'CONTRA-BAIXO',
  [Skill.BATERIA]: 'BATERIA',
  [Skill.MESA_SOM]: 'MESA DE SOM',
  [Skill.OUTROS]: 'OUTROS',
}

function ScheduleUserManagement() {
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [userSkills, setUserSkills] = useState<{ [key: number]: Skill }>({});
    const [assignedSearchTerm, setAssignedSearchTerm] = useState('');
    const [availableSearchTerm, setAvailableSearchTerm] = useState('');
    const searchParams = useSearchParams();
    const router = useRouter();
    const scheduleId = Number(searchParams.get('id'));

    const fetchScheduleAndUsers = useCallback(async () => {
        if (scheduleId) {
            try {
                const scheduleData = await getScheduleById(scheduleId);
                setSchedule(scheduleData);
            } catch (error) {
                toast.error('Falha ao buscar os detalhes da escala.');
                console.error(error);
            }
        }
        try {
            const { users: usersData } = await getUsers({ limit: 'all' });
            setAllUsers(usersData);
        } catch (error) {
            toast.error('Falha ao buscar os usuários.');
            console.error(error);
        }
    }, [scheduleId]);

    useEffect(() => {
        fetchScheduleAndUsers();
    }, [fetchScheduleAndUsers]);


  // Divide os usuários em atribuídos e disponíveis
  const { assignedUsers, availableUsers } = useMemo(() => {
    if (!schedule) return { assignedUsers: [], availableUsers: [] };
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

  // Mapeia as habilidades já atribuídas para acesso rápido
  const assignedUserSkills = useMemo(() => {
    if (!schedule) return new Map<number, Skill>();
    const skillMap = new Map<number, Skill>();
    schedule.users.forEach(u => {
      skillMap.set(u.userId, u.skill as Skill);
    });
    return skillMap;
  }, [schedule]);

  // Handlers de eventos
  const handleSkillChange = (userId: number, skill: Skill) => {
    setUserSkills(prev => ({ ...prev, [userId]: skill }));
  };

  const handleAddUserToSchedule = async (userId: number, skill: Skill) => {
    if (!schedule) return;
    const toastId = toast.loading('Adicionando usuário...');
    try {
      await addUserToSchedule(schedule.id, userId, skill);
      toast.success('Usuário adicionado com sucesso!', { id: toastId });
      await fetchScheduleAndUsers();
    } catch (error) {
      toast.error('Falha ao adicionar usuário à escala.', { id: toastId });
      console.error('[ADD USER ERROR]', error);
    }
  };

  const handleRemoveUserFromSchedule = async (userId: number) => {
    if (!schedule) return;
    const toastId = toast.loading('Removendo usuário...');
    try {
      await removeUserFromSchedule(schedule.id, userId);
      toast.success('Usuário removido com sucesso!', { id: toastId });
      await fetchScheduleAndUsers();
    } catch (error) {
      toast.error('Falha ao remover usuário da escala.', { id: toastId });
      console.error('[REMOVE USER ERROR]', error);
    }
  };

  const handleAddClick = (userId: number) => {
    const skill = userSkills[userId];
    if (skill) {
        handleAddUserToSchedule(userId, skill);
    }
  };

  if(!schedule) {
    return <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">Carregando...</div>
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-gray-900 min-h-screen text-white">
        <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Gerenciar Usuários da Escala</h1>
            <button
              onClick={() => router.back()}
              className="md:w-fit justify-center bg-gray-500 hover:bg-gray-700,
               text-white text-sm py-2 px-4 rounded flex items-center"
            >
              <FaArrowLeft className="mr-2 text-sm" /> Voltar
            </button>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-gray-300">Escala: {schedule.name}</h2>
        <p className="mb-8 text-gray-400">Data: {new Date(schedule.startTime).toLocaleDateString()}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Coluna de Usuários Atribuídos */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="font-semibold text-xl mb-4 text-gray-200">Usuários Atribuídos</h3>
            <input
              type="text"
              placeholder="Buscar usuário atribuído..."
              value={assignedSearchTerm}
              onChange={(e) => setAssignedSearchTerm(e.target.value)}
              className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="space-y-3 max-h-96 overflow-y-auto pr-3">
              {filteredAssignedUsers.length > 0 ? filteredAssignedUsers.map((user) => {
                const skill = assignedUserSkills.get(user.id);
                const formattedSkill = skill ? `(${skillDisplayNames[skill] || skill})` : '';
                return (
                  <div key={user.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md hover:bg-gray-600 transition-colors duration-200">
                    <div className="flex items-center min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white font-bold mr-3 flex-shrink-0">
                        {user.avatar ? (
                          <Image
                            className="w-full h-full object-cover"
                            src={`${api.defaults.baseURL}/files/${user.avatar}`}
                            alt="User avatar"
                            width={40}
                            height={40}
                          />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-gray-200 truncate" title={user.name}>{user.name}</span>
                        {skill && <span className="text-xs text-gray-400 truncate" title={formattedSkill}>{formattedSkill}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUserFromSchedule(user.id)}
                      className="text-sm bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors duration-200 flex-shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                );
              }) : <p className="text-gray-400">Nenhum usuário atribuído.</p>}
            </div>
          </div>

          {/* Coluna de Usuários Disponíveis */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="font-semibold text-xl mb-4 text-gray-200">Usuários Disponíveis</h3>
            <input
              type="text"
              placeholder="Buscar usuário disponível..."
              value={availableSearchTerm}
              onChange={(e) => setAvailableSearchTerm(e.target.value)}
              className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="space-y-3 max-h-96 overflow-y-auto pr-3">
              {filteredAvailableUsers.length > 0 ? filteredAvailableUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-gray-700 p-2 sm:p-3 rounded-md hover:bg-gray-600 transition-colors duration-200">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white font-bold mr-2 sm:mr-3 flex-shrink-0">
                      {user.avatar ? (
                        <Image
                          className="w-full h-full object-cover"
                          src={`${api.defaults.baseURL}/files/${user.avatar}`}
                          alt="User avatar"
                          width={40}
                          height={40}
                        />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <span className="text-gray-200 truncate" title={user.name}>{user.name}</span>
                    {!user.active && <span className="ml-2 text-xs text-red-500">(Desativado)</span>}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <select
                      value={userSkills[user.id] || ''}
                      onChange={(e) => handleSkillChange(user.id, e.target.value as Skill)}
                      className="text-sm bg-gray-600 text-white py-1 px-1 sm:px-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Habilidade</option>
                      {Object.values(Skill).map(skillValue => (
                        <option key={skillValue} value={skillValue}>{truncate(skillDisplayNames[skillValue], 10)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddClick(user.id)}
                      className={`text-sm px-2 sm:px-3 py-1 rounded-md transition-colors duration-200 ${(!userSkills[user.id] || !user.active) ? 'bg-gray-500 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      disabled={!userSkills[user.id] || !user.active}
                      title={!user.active ? 'Usuário desativado' : (!userSkills[user.id] ? 'Selecione uma habilidade' : 'Adicionar à escala')}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              )) : <p className="text-gray-400">Nenhum usuário disponível.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleUserManagementPage() {
    return (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">Carregando...</div>}>
            <ScheduleUserManagement />
        </Suspense>
    )
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

const truncate = (str: string, n: number) => {
  if (str.length <= n) {
    return str;
  }
  return str.slice(0, n) + '...';
};
