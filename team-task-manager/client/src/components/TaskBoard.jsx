import { useState, useEffect, useCallback } from 'react';
import { DndContext, useDroppable, closestCorners, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import DraggableTaskCard from './DraggableTaskCard';
import TaskModal from './TaskModal';
import LabelManager from './LabelManager';
import { PlusIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { columnStyle } from '../utils/uiStyles';

const DroppableColumn = ({ column, tasks, openEditModal, isAdmin, userId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', status: column.id }
  });
  const styles = columnStyle(column.id);

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-[320px] max-w-[410px] flex flex-col rounded-lg border transition-all duration-200 p-4 h-full ${
        isOver
          ? 'border-primary-500 bg-primary-500/10 shadow-xl shadow-primary-500/10'
          : 'border-main bg-slate-50/80 dark:bg-slate-900/30'
      }`}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full shadow-lg ${styles.dot}`}></div>
          <h3 className="font-bold text-sm uppercase tracking-wide">{column.title}</h3>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-black border ${styles.header}`}>
          {tasks.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-2 custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="h-28 flex items-center justify-center border border-dashed border-main rounded-lg text-muted text-sm bg-white/70 dark:bg-slate-950/20">
            <span>Drop tasks here</span>
          </div>
        ) : (
          tasks.map((task) => {
            const isAssigned = task.assignments?.some(a => a.userId === userId);
            const canDrag = isAdmin || isAssigned;
            return (
              <DraggableTaskCard 
                key={task.id} 
                task={task} 
                onClick={() => openEditModal(task)}
                disabled={!canDrag}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

const TaskBoard = ({ project, labels, fetchLabels, refreshProject, isAdmin }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const { user } = useAuth();

  useEffect(() => {
    if (editingTask) {
      const updatedTask = tasks.find(t => t.id === editingTask.id);
      if (updatedTask && updatedTask !== editingTask) {
        // Use a small timeout to avoid synchronous setState in effect warning
        const timer = setTimeout(() => {
          setEditingTask(updatedTask);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [tasks, editingTask]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get(`/tasks/projects/${project.id}/tasks`);
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  const socket = useSocket();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const { data } = await api.get(`/tasks/projects/${project.id}/tasks`);
        if (mounted) {
          setTasks(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch tasks', error);
        if (mounted) setLoading(false);
      }
    };

    loadData();
    
    if (socket) {
      const handleTaskUpdated = () => {
        loadData();
      };
      
      socket.on('taskUpdated', handleTaskUpdated);
      
      return () => {
        mounted = false;
        socket.off('taskUpdated', handleTaskUpdated);
      };
    }

    return () => {
      mounted = false;
    };
  }, [project.id, socket]);

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const onTaskSaved = () => {
    fetchTasks();
    refreshProject();
    closeModal();
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    // If dropped outside of any valid droppable area, do nothing
    if (!over) return;

    const taskId = active.id;
    const taskData = active.data.current?.task;
    const newStatus = over.id;

    // If status hasn't changed, do nothing
    if (!taskData || taskData.status === newStatus) return;

    // Optimistically update local state
    setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      // Persist the change
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      refreshProject(); // Update project stats
    } catch (error) {
      console.error('Failed to update task status during drag', error);
      // Revert optimistic update on failure
      fetchTasks();
    }
  };

  const columns = [
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' }
  ];

  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div></div>;
  }

  return (
    <div className="h-full min-h-[520px] flex flex-col">
      {isAdmin && (
        <div className="glass-card rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
          <div>
            <h2 className="font-black">Task Board</h2>
            <p className="text-muted text-sm">Drag assigned tasks between columns or create new work.</p>
          </div>
          <div className="flex justify-end gap-3">
          <button onClick={() => setIsLabelManagerOpen(true)} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Labels</span>
          </button>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 text-sm py-2">
            <PlusIcon className="w-4 h-4" />
            <span>Create Task</span>
          </button>
          </div>
        </div>
      )}

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 overflow-x-auto pb-4 h-full">
          {columns.map((col) => (
            <DroppableColumn 
              key={col.id}
              column={col}
              tasks={tasks.filter(t => t.status === col.id)}
              openEditModal={openEditModal}
              isAdmin={isAdmin}
              userId={user?.id}
            />
          ))}
        </div>
      </DndContext>

      {isModalOpen && (
        <TaskModal 
          task={editingTask} 
          projectId={project.id}
          members={project.members}
          labels={labels}
          onClose={closeModal} 
          onSave={onTaskSaved}
          isAdmin={isAdmin}
        />
      )}

      {isLabelManagerOpen && (
        <LabelManager
          projectId={project.id}
          labels={labels}
          fetchLabels={fetchLabels}
          onClose={() => setIsLabelManagerOpen(false)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default TaskBoard;
