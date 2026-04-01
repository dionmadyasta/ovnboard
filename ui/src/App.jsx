import React, { useState, useEffect } from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  DragOverlay,
  useDroppable,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Search, Bell, Settings, LogOut, ChevronRight,
  Share, Filter, MoreHorizontal, Calendar, Clock,
  CheckCircle2, LayoutDashboard, TerminalSquare,
  Grab, Bolt, Bug, Sparkles, X, Trash2, CalendarDays,
  Activity, PieChart, BarChart3, TrendingUp
} from 'lucide-react';
import LoginPage from './components/LoginPage';
import { supabase } from './supabase';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'var(--primary-container)', textColor: 'var(--primary)' },
  { id: 'in-progress', title: 'In Progress', color: 'var(--secondary-container)', textColor: 'var(--secondary)' },
  { id: 'completed', title: 'Completed', color: 'var(--tertiary-container)', textColor: 'var(--tertiary)' },
];

const SortableTask = ({ task, isOverlay = false, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
    padding: '24px',
    backgroundColor: 'var(--surface-container-lowest)',
    borderRadius: '24px',
    marginBottom: '16px',
    border: task.status === 'completed' ? '1px solid var(--tertiary-container)' : '1px solid transparent',
    boxShadow: isOverlay ? '0 32px 64px rgba(0,0,0,0.15)' : 'none',
    cursor: isOverlay ? 'grabbing' : 'grab',
    position: 'relative'
  };

  const formatTime = (isoString) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => !isOverlay && onEdit(task)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        {task.due_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={12} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', fontWeight: '800' }}>
              DUE {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.2, padding: '4px' }}
          className="delete-task-btn"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px', color: 'var(--on-surface)' }}>{task.title}</h3>
      <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', opacity: 0.6, lineHeight: '1.6', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: '16px' }}>
        {task.description}
      </p>

      {/* Timestamp Tracking UI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--surface-variant)', paddingTop: '12px', opacity: 0.4 }}>
        {task.moved_to_progress_at && task.status !== 'backlog' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '600' }}>
            <Clock size={10} />
            <span>STARTED {formatTime(task.moved_to_progress_at)}</span>
          </div>
        )}
        {task.status === 'completed' && task.moved_to_completed_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '600', color: 'var(--tertiary)' }}>
            <CheckCircle2 size={10} />
            <span>FINISHED {formatTime(task.moved_to_completed_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const KanColumn = ({ column, tasks, onEdit, onDelete }) => {
  const { setNodeRef } = useDroppable({ id: column.id });
  return (
    <div style={{ flex: 1, minWidth: '350px', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '900', color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>{column.title}</span>
          <span style={{ padding: '2px 8px', borderRadius: '100px', backgroundColor: column.color, color: column.textColor, fontSize: '10px', fontWeight: '900' }}>{tasks.length}</span>
        </div>
        <MoreHorizontal size={18} style={{ opacity: 0.3 }} />
      </header>
      <div ref={setNodeRef} style={{ backgroundColor: 'var(--surface-container-low)', borderRadius: '24px', padding: '16px', minHeight: '300px', flexGrow: 1 }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (<SortableTask key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />))}
        </SortableContext>
        {column.id === 'backlog' && (<button className="add-task-btn" onClick={() => window.openCreateTaskModal()}><Plus size={16} /> Create Item</button>)}
      </div>
    </div>
  );
};

const TaskModal = ({ isOpen, onClose, onSave, task = null }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDesc(task.description || '');
      setDueDate(task.due_date || '');
    } else {
      setTitle('');
      setDesc('');
      setDueDate('');
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, description: desc, due_date: dueDate });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>TITLE</label>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
            />
          </div>
          <div className="form-group">
            <label>DESCRIPTION</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>DUE DATE</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="modal-submit-btn">{task ? 'Save Changes' : 'Create Task'}</button>
        </form>
      </div>
    </div>
  );
};

const TimelineView = ({ tasks }) => {
  const DAY_WIDTH = 48;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 14);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 365); // Extended to 1 year

  const getDaysArray = (start, end) => {
    const arr = [];
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      arr.push(new Date(dt));
    }
    return arr;
  };

  const days = getDaysArray(startDate, endDate);

  const getMonths = (daysArray) => {
    const months = [];
    let currentMonth = { name: '', days: 0 };

    daysArray.forEach(d => {
      const mName = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      if (mName !== currentMonth.name) {
        if (currentMonth.days > 0) months.push(currentMonth);
        currentMonth = { name: mName, days: 1 };
      } else {
        currentMonth.days++;
      }
    });
    months.push(currentMonth);
    return months;
  };

  const months = getMonths(days);

  const calculatePosition = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays * DAY_WIDTH;
  };

  const todayPos = calculatePosition(today.toISOString());
  const gridRef = React.useRef(null);

  useEffect(() => {
    if (gridRef.current && todayPos) {
      gridRef.current.scrollLeft = todayPos - 200;
    }
  }, [todayPos]);

  const isDown = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);

  const handleMouseDown = (e) => {
    isDown.current = true;
    gridRef.current.classList.add('grabbing');
    startX.current = e.pageX - gridRef.current.offsetLeft;
    scrollLeft.current = gridRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    gridRef.current.classList.remove('grabbing');
  };

  const handleMouseUp = () => {
    isDown.current = false;
    gridRef.current.classList.remove('grabbing');
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - gridRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // scroll-speed
    gridRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="timeline-container">
      <div className="timeline-body">
        <div className="timeline-sidebar">
          <div className="timeline-sidebar-header" style={{ height: '64px', position: 'sticky', top: 0, zIndex: 30 }}>Tasks</div>
          {tasks.map(task => (
            <div key={task.id} className="timeline-sidebar-item">
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: task.status === 'completed' ? 'var(--tertiary)' : (task.status === 'in_progress' ? 'var(--secondary)' : 'var(--on-surface-variant)'),
                marginRight: '12px',
                flexShrink: 0
              }}></span>
              {task.title}
            </div>
          ))}
        </div>
        <div 
          ref={gridRef} 
          className="timeline-grid-container"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{ 
            flexGrow: 1, 
            overflowX: 'auto', 
            overflowY: 'hidden',
            position: 'relative', 
            cursor: 'grab',
            scrollBehavior: 'auto' // Instant scroll for dragging
          }}
        >
          <div style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: 'var(--surface-container-low)', width: days.length * DAY_WIDTH }}>
            <div style={{ display: 'flex' }}>
              {months.map((m, i) => (
                <div key={i} className="month-header" style={{ width: m.days * DAY_WIDTH, borderTop: 'none' }}>{m.name}</div>
              ))}
            </div>
            <div style={{ display: 'flex' }}>
              {days.map((d, i) => (
                <div key={i} className={`day-header ${[0, 6].includes(d.getDay()) ? 'weekend' : ''}`} style={{ width: DAY_WIDTH }}>
                  {d.getDate()}
                </div>
              ))}
            </div>
          </div>

          <div className="timeline-grid" style={{ width: days.length * DAY_WIDTH }}>
            {days.map((_, i) => (
              <div key={i} className="timeline-grid-cell" style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }} />
            ))}

            <div className="timeline-today-line" style={{ left: todayPos }}>
              <div className="timeline-today-indicator">TODAY</div>
            </div>

            {tasks.map((task) => {
              const endPos = calculatePosition(task.due_date);
              if (endPos === null) return null;
              const startPos = endPos - (DAY_WIDTH * 2);
              const width = Math.max(DAY_WIDTH * 1.5, endPos - startPos);

              return (
                <div key={task.id} className="timeline-grid-row">
                  {endPos >= 0 && endPos <= (days.length * DAY_WIDTH) && (
                    <div
                      className="timeline-bar"
                      style={{
                        left: startPos,
                        width: width,
                        backgroundColor: task.status === 'completed' ? 'var(--tertiary)' : task.status === 'in-progress' ? 'var(--primary)' : 'var(--on-surface-variant)',
                        opacity: task.status === 'backlog' ? 0.6 : 1,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {task.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsView = ({ tasks }) => {
  const stats = {
    total: tasks.length || 0,
    backlog: tasks.filter(t => t.status === 'backlog').length,
    progress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const progressRate = stats.total > 0 ? Math.round((stats.progress / stats.total) * 100) : 0;

  const productivityScore = stats.total > 0
    ? Math.min(100, Math.max(0, (completionRate * 1) + (progressRate * 0.5) - ((stats.backlog / stats.total) * 20)))
    : 0;

  const circumference = 2 * Math.PI * 40;
  const offsetB = (stats.backlog / (stats.total || 1)) * circumference;
  const offsetP = (stats.progress / (stats.total || 1)) * circumference;
  const offsetC = (stats.completed / (stats.total || 1)) * circumference;

  return (
    <div className="analytics-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(74, 64, 224, 0.1)', color: 'var(--primary)' }}>
            <BarChart3 size={24} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 200, 133, 0.2)', color: 'var(--secondary)' }}>
            <Activity size={24} />
          </div>
          <div className="stat-value">{stats.progress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(105, 246, 184, 0.2)', color: 'var(--tertiary)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="analytics-content">
        <div className="chart-card">
          <div style={{ alignSelf: 'flex-start', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Task Distribution</h3>
            <p style={{ fontSize: '13px', opacity: 0.5 }}>Overview of current workload</p>
          </div>
          <div className="chart-container">
            <svg width="240" height="240" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-container-low)" strokeWidth="12" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--primary-container)" strokeWidth="12"
                strokeDasharray={`${offsetB} ${circumference}`} transform="rotate(-90 50 50)" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--primary)" strokeWidth="12"
                strokeDasharray={`${offsetP} ${circumference}`} strokeDashoffset={-offsetB} transform="rotate(-90 50 50)" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--tertiary-container)" strokeWidth="12"
                strokeDasharray={`${offsetC} ${circumference}`} strokeDashoffset={-(offsetB + offsetP)} transform="rotate(-90 50 50)" />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--on-surface)' }}>{completionRate}%</span>
              <span style={{ fontSize: '10px', fontWeight: '800', opacity: 0.4 }}>DONE</span>
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div style={{ display: 'flex', alignItems: 'center' }}><div className="legend-dot" style={{ backgroundColor: 'var(--tertiary-container)' }} /> Completed</div>
              <span>{stats.completed} tasks</span>
            </div>
            <div className="legend-item">
              <div style={{ display: 'flex', alignItems: 'center' }}><div className="legend-dot" style={{ backgroundColor: 'var(--primary)' }} /> In Progress</div>
              <span>{stats.progress} tasks</span>
            </div>
            <div className="legend-item">
              <div style={{ display: 'flex', alignItems: 'center' }}><div className="legend-dot" style={{ backgroundColor: 'var(--primary-container)' }} /> Backlog</div>
              <span>{stats.backlog} tasks</span>
            </div>
          </div>
        </div>

        <div className="insights-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Performance Insights</h3>
            <TrendingUp size={24} />
          </div>

          <div className="insight-point">
            <div className="insight-icon"><Activity size={18} /></div>
            <div className="insight-text">
              <h4>Productivity Score: {Math.round(productivityScore)}%</h4>
              <p>Combined metric of movement and task completion.</p>
              <div className="productivity-meter">
                <div className="productivity-fill" style={{ width: `${productivityScore}%`, backgroundColor: 'white' }} />
              </div>
            </div>
          </div>

          <div className="insight-point">
            <div className="insight-icon"><Sparkles size={18} /></div>
            <div className="insight-text">
              <h4>
                {productivityScore > 70 ? 'You\'re on fire!' : productivityScore > 40 ? 'Steady Progress' : 'Need Focus'}
              </h4>
              <p>
                {stats.backlog > stats.progress * 2
                  ? 'Warning: High backlog volume detected compared to active progress.'
                  : 'Balanced: Your active tasks and backlog are well-managed.'}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'auto', padding: '24px', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.1)', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <strong>Recommendation:</strong> Consider moving 2 tasks from Backlog to In Progress to maintain momentum.
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentView, setCurrentView] = useState('board');

  window.openCreateTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:8000/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) { console.error("Data fetch error:", error); }
  };

  useEffect(() => {
    if (user) { fetchTasks(); }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      try {
        const response = await fetch(`http://localhost:8000/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        });
        if (response.ok) {
          const updated = await response.json();
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }
      } catch (error) { console.error("Update task error:", error); }
    } else {
      const newTask = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.due_date,
        status: 'backlog'
      };
      try {
        const response = await fetch('http://localhost:8000/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask)
        });
        if (response.ok) {
          const result = await response.json();
          setTasks(prev => [...prev, result]);
        }
      } catch (error) { console.error("Create task error:", error); }
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:8000/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (error) { console.error("Delete task error:", error); }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = (id) => {
    if (COLUMNS.find(c => c.id === id)) return id;
    const task = tasks.find(t => t.id === id);
    return task ? task.status : null;
  };

  const handleDragStart = ({ active }) => { 
    setActiveTask(tasks.find(t => t.id === active.id)); 
  };

  const handleDragOver = ({ active, over }) => {
    const activeId = active.id;
    const overId = over ? over.id : null;
    if (!overId || activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setTasks((prev) => {
      const activeIndex = prev.findIndex(t => t.id === activeId);
      const overIndex = prev.findIndex(t => t.id === overId);
      
      let newIndex;
      if (COLUMNS.find(c => c.id === overId)) {
        // Dragged over an empty column
        newIndex = prev.length;
      } else {
        newIndex = overIndex >= 0 ? overIndex : prev.length;
      }

      const newTasks = [...prev];
      newTasks[activeIndex] = { ...prev[activeIndex], status: overContainer };
      return arrayMove(newTasks, activeIndex, newIndex);
    });
  };

  const handleDragEnd = async ({ active, over }) => {
    const activeId = active.id;
    const overId = over ? over.id : null;
    
    if (!overId) {
      setActiveTask(null);
      return;
    }

    const activeIndex = tasks.findIndex(t => t.id === activeId);
    const overIndex = tasks.findIndex(t => t.id === overId);

    let finalTasks = [...tasks];
    if (activeIndex !== overIndex) {
      finalTasks = arrayMove(tasks, activeIndex, overIndex);
      setTasks(finalTasks);
    }

    const movedTask = finalTasks.find(t => t.id === activeId);
    
    try {
        // Update task status and persist reordered positions
        await fetch(`http://localhost:8000/tasks/${activeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: movedTask.status })
        });

        const reorderPayload = finalTasks.map((t, index) => ({
            id: t.id,
            position: index
        }));

        await fetch('http://localhost:8000/tasks/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reorderPayload)
        });
    } catch (error) {
        console.error("Sync error:", error);
    }
    
    setActiveTask(null);
  };

  if (isLoading) { return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>; }
  if (!user) { return <LoginPage onLogin={setUser} />; }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-box" style={{ overflow: 'hidden' }}>
            <img src="/ovn_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }} />
          </div>
          <div className="logo-text"><h2>OVN Boards</h2></div>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'board' ? 'active' : ''}`}
            onClick={() => setCurrentView('board')}
            style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
          >
            <LayoutDashboard size={18} /><span>Workspace</span>
          </button>
          <button
            className={`nav-item ${currentView === 'timeline' ? 'active' : ''}`}
            onClick={() => setCurrentView('timeline')}
            style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', marginTop: '8px' }}
          >
            <CalendarDays size={18} /><span>Timeline</span>
          </button>
          <button
            className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentView('analytics')}
            style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', marginTop: '8px' }}
          >
            <PieChart size={18} /><span>Insights</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="footer-btn"><Settings size={18} /> <span>Settings</span></button>
          <button className="footer-btn logout" onClick={handleLogout}><LogOut size={18} /> <span>Logout</span></button>
        </div>
      </aside>

      <div className="main-container">
        <header className="topbar">
          <div className="topbar-search"><Search size={16} /><input placeholder="Search tasks..." /></div>
          <div className="topbar-actions">
            <span style={{ fontSize: '13px', fontWeight: '700', marginRight: '12px', opacity: 0.6 }}>{user.email}</span>
            <button className="icon-btn"><Bell size={18} /></button>
            <button className="primary-btn" onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Task</button>
          </div>
        </header>

        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
          task={editingTask}
        />

        <main className="content">
          <div className="content-header">
            <div className="breadcrumb">PROJECTS / {currentView === 'board' ? 'WORKSPACE' : currentView.toUpperCase()}</div>
            <h1>
              {currentView === 'board' && 'Project Roadmap'}
              {currentView === 'timeline' && 'Project Timeline'}
              {currentView === 'analytics' && 'Project Insights'}
            </h1>
          </div>

          {currentView === 'board' ? (
            <div className="board-wrapper">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                {COLUMNS.map(col => (
                  <KanColumn
                    key={col.id}
                    column={col}
                    tasks={tasks.filter(t => t.status === col.id)}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTask}
                  />
                ))}
                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                  {activeTask ? <SortableTask task={activeTask} isOverlay /> : null}
                </DragOverlay>
              </DndContext>
            </div>
          ) : currentView === 'timeline' ? (
            <TimelineView tasks={tasks} />
          ) : (
            <AnalyticsView tasks={tasks} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
