import { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, X } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('zen-todos');
    return saved ? JSON.parse(saved) : [
      { id: '1', text: '喝杯水', completed: false },
      { id: '2', text: '休息一下', completed: false }
    ];
  });
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    localStorage.setItem('zen-todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: inputValue, completed: false }]);
    setInputValue('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="w-full h-full flex flex-col p-4 text-white select-none bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 transition-all duration-300 hover:bg-black/30">
      <div className="flex items-center gap-2 mb-3 opacity-80">
        <CheckSquare size={18} />
        <span className="font-medium text-sm">待办事项</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
        {todos.map(todo => (
          <div key={todo.id} className="group flex items-center gap-2 text-sm">
            <button 
              onClick={() => toggleTodo(todo.id)}
              className="text-white/70 hover:text-white transition-colors"
            >
              {todo.completed ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
            <span className={`flex-1 truncate transition-all ${todo.completed ? 'line-through opacity-40' : 'opacity-90'}`}>
              {todo.text}
            </span>
            <button 
              onClick={() => deleteTodo(todo.id)}
              className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {todos.length === 0 && (
            <div className="text-white/30 text-xs text-center py-4">无待办事项</div>
        )}
      </div>

      <form onSubmit={addTodo} className="mt-3 relative">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="添加新任务..."
          className="w-full bg-white/10 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:bg-white/20 transition-all pr-8"
        />
        <button 
            type="submit"
            className="absolute right-1.5 top-1.5 text-white/50 hover:text-white transition-colors"
        >
            <Plus size={14} />
        </button>
      </form>
    </div>
  );
};
