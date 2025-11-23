
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.114:5000/api';


const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'حدث خطأ في الطلب');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};


let authToken = null;

export const setToken = (token) => {
  authToken = token;
};

export const getToken = async () => {
  
  return authToken;
};


export const authAPI = {
  register: async (userData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (email, password) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      setToken(response.token);
    }
    
    return response;
  },

  getMe: async () => {
    return apiCall('/auth/me');
  },
};


export const booksAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/books${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id) => {
    return apiCall(`/books/${id}`);
  },

  create: async (bookData, imageFile) => {
    const formData = new FormData();
    Object.keys(bookData).forEach(key => {
      formData.append(key, bookData[key]);
    });
    if (imageFile) {
      formData.append('cover_image', {
        uri: imageFile.uri,
        type: 'image/jpeg',
        name: 'cover.jpg',
      });
    }

    return apiCall('/books', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  },

  update: async (id, bookData, imageFile) => {
    const formData = new FormData();
    Object.keys(bookData).forEach(key => {
      formData.append(key, bookData[key]);
    });
    if (imageFile) {
      formData.append('cover_image', {
        uri: imageFile.uri,
        type: 'image/jpeg',
        name: 'cover.jpg',
      });
    }

    return apiCall(`/books/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  },

  delete: async (id) => {
    return apiCall(`/books/${id}`, {
      method: 'DELETE',
    });
  },
};


export const lecturesAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/lectures${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id) => {
    return apiCall(`/lectures/${id}`);
  },
};


export const attendanceAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/attendance${queryString ? `?${queryString}` : ''}`);
  },

  create: async (attendanceData) => {
    return apiCall('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  },

  update: async (id, attendanceData) => {
    return apiCall(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
  },
};


export const paymentsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/payments${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id) => {
    return apiCall(`/payments/${id}`);
  },
};


export const newsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/news${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id) => {
    return apiCall(`/news/${id}`);
  },
};


export const borrowingsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/borrowings${queryString ? `?${queryString}` : ''}`);
  },

  create: async (bookId) => {
    return apiCall('/borrowings', {
      method: 'POST',
      body: JSON.stringify({ book_id: bookId }),
    });
  },

  returnBook: async (id) => {
    return apiCall(`/borrowings/${id}/return`, {
      method: 'PUT',
    });
  },
};


export const studentsAPI = {
  getMe: async () => {
    return apiCall('/students/me');
  },

  updateMe: async (studentData, avatarFile) => {
    const formData = new FormData();
    Object.keys(studentData).forEach(key => {
      formData.append(key, studentData[key]);
    });
    if (avatarFile) {
      formData.append('avatar', {
        uri: avatarFile.uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });
    }

    return apiCall('/students/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  },
};

export default {
  auth: authAPI,
  books: booksAPI,
  lectures: lecturesAPI,
  attendance: attendanceAPI,
  payments: paymentsAPI,
  news: newsAPI,
  borrowings: borrowingsAPI,
  students: studentsAPI,
};

