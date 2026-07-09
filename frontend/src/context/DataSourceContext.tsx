import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import {
  EmployeeDataSource,
  employeeDataSourceStorageKey,
} from '../constants/dataSources';

type DataSourceContextValue = {
  dataSource: EmployeeDataSource;
  setDataSource: (source: EmployeeDataSource) => void;
};

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

function getInitialDataSource(): EmployeeDataSource {
  localStorage.setItem(employeeDataSourceStorageKey, 'hr-staff');
  return 'hr-staff';
}

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [dataSource, setDataSourceState] = useState<EmployeeDataSource>(getInitialDataSource);

  const value = useMemo<DataSourceContextValue>(() => ({
    dataSource,
    setDataSource: (source) => {
      localStorage.setItem(employeeDataSourceStorageKey, source);
      setDataSourceState(source);
    },
  }), [dataSource]);

  return <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>;
}

export function useDataSource() {
  const context = useContext(DataSourceContext);
  if (!context) throw new Error('useDataSource must be used within DataSourceProvider.');
  return context;
}
