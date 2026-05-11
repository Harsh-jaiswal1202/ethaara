import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';

const DraggableTaskCard = ({ task, onClick, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: disabled ? 'default' : 'grab',
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' : 'static'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className="touch-none"
    >
      <TaskCard 
        task={task} 
        onClick={() => {
          // If dragging, we don't want to trigger click
          // A simple workaround is relying on onPointerDown inside listeners
          // but we can just pass the onClick
          onClick();
        }} 
      />
    </div>
  );
};

export default DraggableTaskCard;
