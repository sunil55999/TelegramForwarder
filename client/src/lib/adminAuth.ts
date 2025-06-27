export const getAdminToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

export const setAdminToken = (token: string): void => {
  localStorage.setItem('adminToken', token);
};

export const removeAdminToken = (): void => {
  localStorage.removeItem('adminToken');
};

export const isAdminAuthenticated = (): boolean => {
  return !!getAdminToken();
};

export const adminApiRequest = async (method: string, url: string, data?: any) => {
  const token = getAdminToken();
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};