const routePreloaders = {
  dashboard: () => import('../pages/Dashboard'),
  deals: () => import('../pages/Dashboard'),
  dealDetails: () => import('../pages/DealDetails'),
  addDeal: () => import('../pages/AddDeal'),
  history: () => import('../pages/HistoryPage'),
  profile: () => import('../pages/AdminProfile'),
  createUser: () => import('../pages/CreateUser'),
  manageUsers: () => import('../pages/ManageUsers'),
};

export const preloadRoute = (key) => {
  const load = routePreloaders[key];
  if (!load) return Promise.resolve();
  return load().catch(() => {});
};

export const preloadRouteForPath = (path) => {
  if (!path) return Promise.resolve();

  if (path.startsWith('/deals/')) return preloadRoute('dealDetails');
  if (path.startsWith('/dashboard') || path === '/deals') return preloadRoute('dashboard');
  if (path === '/add-deal') return preloadRoute('addDeal');
  if (path === '/history') return preloadRoute('history');
  if (path === '/profile') return preloadRoute('profile');
  if (path === '/create-user') return preloadRoute('createUser');
  if (path === '/manage-users') return preloadRoute('manageUsers');

  return Promise.resolve();
};
