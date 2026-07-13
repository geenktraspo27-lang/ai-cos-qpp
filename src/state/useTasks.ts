import { usePersistedState } from '../lib/usePersistedState';
import { employeeById } from '../data/employees';
import type { EmployeeId } from '../types';

type TasksById = Partial<Record<EmployeeId, string[]>>;

/** Founder-editable "Current Tasks" per employee, persisted under `aicos_tasks`. */
export function useTasks() {
  const [tasksById, setTasksById] = usePersistedState<TasksById>('tasks', {});

  const tasksOf = (id: EmployeeId): string[] => tasksById[id] ?? employeeById(id).tasks;

  const updateTask = (id: EmployeeId, index: number, text: string) => {
    setTasksById((prev) => {
      const list = tasksOf(id).slice();
      list[index] = text;
      return { ...prev, [id]: list };
    });
  };

  const addTask = (id: EmployeeId) => {
    setTasksById((prev) => {
      const list = tasksOf(id).slice();
      list.push('新しいタスク');
      return { ...prev, [id]: list };
    });
  };

  const removeTask = (id: EmployeeId, index: number) => {
    setTasksById((prev) => {
      const list = tasksOf(id).slice();
      list.splice(index, 1);
      return { ...prev, [id]: list };
    });
  };

  return { tasksOf, updateTask, addTask, removeTask };
}
