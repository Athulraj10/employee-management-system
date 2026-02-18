import React, { createContext, useContext, useReducer, Dispatch } from 'react';

type AttendanceViewState = {
  selectedDate: string;
};

type AppState = {
  attendanceView: AttendanceViewState;
};

type AppAction =
  | { type: 'attendance/setDate'; payload: string };

const today = new Date().toISOString().split('T')[0];

const initialState: AppState = {
  attendanceView: {
    selectedDate: today,
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'attendance/setDate':
      return {
        ...state,
        attendanceView: {
          ...state.attendanceView,
          selectedDate: action.payload,
        },
      };
    default:
      return state;
  }
}

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<Dispatch<AppAction> | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
};

export const useAppDispatch = () => {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) {
    throw new Error('useAppDispatch must be used within AppStateProvider');
  }
  return ctx;
};

export const useAttendanceViewState = () => {
  const { attendanceView } = useAppState();
  return attendanceView;
};


