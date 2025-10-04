'use client';

import { useMemo } from 'react';
import { Schedule } from '../services/scheduleService';
import { Task, TaskStatus } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import ScheduleFileManagement from './ScheduleFileManagement';

interface ScheduleTaskManagementProps {
  schedule: Schedule;
  allTasks: Task[];
  onAssignTask: (taskId: number) => void;
  onUnassignTask: (taskId: number) => void; // Future feature
  onFileUpload: (file: File) => void;
}

export default function ScheduleTaskManagement({ schedule, allTasks, onAssignTask, onUnassignTask, onFileUpload }: ScheduleTaskManagementProps) {
  const { user } = useAuth();

  const { assignedTasks, availableTasks } = useMemo(() => {
    const assigned = allTasks.filter(t => t.scheduleId === schedule.id);
    // A task is available if it's not completed and not assigned to ANY schedule
    const available = allTasks.filter(t => !t.scheduleId && !t.completed);
    return { assignedTasks: assigned, availableTasks: available };
  }, [schedule, allTasks]);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Assigned Tasks */}
      <div>
        <h4 className="font-semibold text-lg mb-2 text-gray-200">Tarefas Atribuídas</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {assignedTasks.length > 0 ? assignedTasks.map(task => (
            <div key={task.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
              <span className="text-gray-200">{task.name}</span>
              <button
                onClick={() => onUnassignTask(task.id)}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Desatribuir
              </button>
            </div>
          )) : <p className="text-sm text-gray-400">Nenhuma tarefa atribuída.</p>}
        </div>
      </div>

      {/* Available Tasks */}
      <div>
        <h4 className="font-semibold text-lg mb-2 text-gray-200">Tarefas Disponíveis</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {availableTasks.length > 0 ? availableTasks.map(task => (
            <div key={task.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
              <span className="text-gray-200">{task.name}</span>
              <button
                onClick={() => onAssignTask(task.id)}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                Atribuir
              </button>
            </div>
          )) : <p className="text-sm text-gray-400">Nenhuma tarefa disponível.</p>}
        </div>
      </div>
      <div className="col-span-2">
        <ScheduleFileManagement scheduleId={schedule.id} onFileUpload={onFileUpload} />
      </div>
    </div>
  );
}