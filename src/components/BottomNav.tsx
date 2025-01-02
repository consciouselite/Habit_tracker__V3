import { Home, ListTodo, BarChart2, Image, Target } from 'lucide-react';
    import { NavLink } from 'react-router-dom';

    export function BottomNav() {
      return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex flex-col items-center ${isActive ? 'text-blue-600' : 'text-gray-600'}`
              }
            >
              <Home size={24} />
              <span className="text-xs mt-1">Dashboard</span>
            </NavLink>
            
            <NavLink
              to="/habits"
              className={({ isActive }) =>
                `flex flex-col items-center ${isActive ? 'text-blue-600' : 'text-gray-600'}`
              }
            >
              <ListTodo size={24} />
              <span className="text-xs mt-1">Habits</span>
            </NavLink>
            
            <NavLink
              to="/stats"
              className={({ isActive }) =>
                `flex flex-col items-center ${isActive ? 'text-blue-600' : 'text-gray-600'}`
              }
            >
              <BarChart2 size={24} />
              <span className="text-xs mt-1">Stats</span>
            </NavLink>
            
            <NavLink
              to="/flexbook"
              className={({ isActive }) =>
                `flex flex-col items-center ${isActive ? 'text-blue-600' : 'text-gray-600'}`
              }
            >
              <Image size={24} />
              <span className="text-xs mt-1">FlexBook</span>
            </NavLink>
            <NavLink
              to="/goals"
              className={({ isActive }) =>
                `flex flex-col items-center ${isActive ? 'text-blue-600' : 'text-gray-600'}`
              }
            >
              <Target size={24} />
              <span className="text-xs mt-1">Goals</span>
            </NavLink>
          </div>
        </nav>
      );
    }
