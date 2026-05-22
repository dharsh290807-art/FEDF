/* ══════════════════════════════════════════════
   EDUTRACK — AUTHENTICATION SYSTEM
   Registration, login, session management,
   email domain validation, and page guards
   ══════════════════════════════════════════════ */

// ── Constants ──
const STORAGE_KEYS = {
  USERS: 'edutrack_users',
  SESSION: 'edutrack_session'
};

const ALLOWED_DOMAINS = {
  student: ['@klh.edu.in'],
  teacher: ['@teacher.com']
};

// ── Pre-populate demo student data ──
const DEMO_STUDENT_DATA = [
  { name: 'Aarav Sharma',  initials: 'AS', color: '#4f8ef7', marks: 83, attend: 92, assign: 95, math: 85, science: 82, english: 78, social: 84, computer: 86 },
  { name: 'Priya Nair',    initials: 'PN', color: '#22d3a0', marks: 91, attend: 97, assign: 98, math: 94, science: 90, english: 88, social: 89, computer: 94 },
  { name: 'Rohan Gupta',   initials: 'RG', color: '#f59e0b', marks: 56, attend: 74, assign: 62, math: 58, science: 52, english: 55, social: 60, computer: 55 },
  { name: 'Sneha Reddy',   initials: 'SR', color: '#7c5cfc', marks: 71, attend: 85, assign: 78, math: 74, science: 70, english: 68, social: 72, computer: 71 },
  { name: 'Karan Mehta',   initials: 'KM', color: '#f43f5e', marks: 43, attend: 61, assign: 45, math: 42, science: 45, english: 38, social: 48, computer: 42 },
  { name: 'Divya Iyer',    initials: 'DI', color: '#22d3a0', marks: 80, attend: 90, assign: 88, math: 82, science: 79, english: 78, social: 80, computer: 81 },
  { name: 'Arjun Verma',   initials: 'AV', color: '#4f8ef7', marks: 67, attend: 80, assign: 72, math: 70, science: 65, english: 64, social: 68, computer: 68 },
  { name: 'Lakshmi Das',   initials: 'LD', color: '#22d3a0', marks: 91, attend: 96, assign: 97, math: 93, science: 92, english: 89, social: 88, computer: 93 },
  { name: 'Vikram Singh',  initials: 'VS', color: '#f43f5e', marks: 49, attend: 68, assign: 50, math: 48, science: 50, english: 45, social: 52, computer: 50 },
  { name: 'Meena Patel',   initials: 'MP', color: '#7c5cfc', marks: 75, attend: 88, assign: 82, math: 78, science: 74, english: 72, social: 76, computer: 75 },
  { name: 'Suresh Kumar',  initials: 'SK', color: '#f59e0b', marks: 61, attend: 78, assign: 68, math: 64, science: 60, english: 58, social: 62, computer: 61 },
  { name: 'Ananya Joshi',  initials: 'AJ', color: '#4f8ef7', marks: 86, attend: 94, assign: 93, math: 88, science: 85, english: 84, social: 86, computer: 87 },
];

// ── Utility Functions ──

/**
 * Detect role from email domain
 * @param {string} email
 * @returns {'student'|'teacher'|null}
 */
function detectRole(email) {
  if (!email) return null;
  email = email.toLowerCase().trim();
  
  for (const domain of ALLOWED_DOMAINS.student) {
    if (email.endsWith(domain)) return 'student';
  }
  for (const domain of ALLOWED_DOMAINS.teacher) {
    if (email.endsWith(domain)) return 'teacher';
  }
  return null;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Get initials from name
 */
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Get a random color for avatar
 */
function getRandomColor() {
  const colors = ['#4f8ef7', '#7c5cfc', '#22d3a0', '#f59e0b', '#f43f5e'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Assign demo data to a new student
 */
function assignDemoData() {
  const template = DEMO_STUDENT_DATA[Math.floor(Math.random() * DEMO_STUDENT_DATA.length)];
  // Add some randomness ±5
  const vary = (val) => Math.max(0, Math.min(100, val + Math.floor(Math.random() * 10) - 5));
  return {
    marks: vary(template.marks),
    attend: vary(template.attend),
    assign: vary(template.assign),
    math: vary(template.math),
    science: vary(template.science),
    english: vary(template.english),
    social: vary(template.social),
    computer: vary(template.computer),
    trend: [
      vary(template.marks - 8),
      vary(template.marks - 5),
      vary(template.marks - 3),
      vary(template.marks - 1),
      vary(template.marks),
      vary(template.marks + 2),
    ]
  };
}

// ── Storage Functions ──

function getUsers() {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getSession() {
  const data = localStorage.getItem(STORAGE_KEYS.SESSION);
  return data ? JSON.parse(data) : null;
}

function setSession(user) {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

// ── Auth Functions ──

/**
 * Register a new user
 * @returns {{ success: boolean, message: string, user?: object }}
 */
function register(name, email, password, confirmPassword) {
  // Validate fields
  if (!name || !email || !password || !confirmPassword) {
    return { success: false, message: 'All fields are required.' };
  }

  if (name.trim().length < 2) {
    return { success: false, message: 'Please enter a valid name.' };
  }

  if (!isValidEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  // Detect role
  const role = detectRole(email);
  if (!role) {
    return { 
      success: false, 
      message: 'Invalid email domain. Use @klh.edu.in (student) or @teacher.com (teacher).' 
    };
  }

  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }

  if (password !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' };
  }

  // Check if user already exists
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  // Create user
  const user = {
    id: Date.now().toString(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password, // In production, this would be hashed
    role: role,
    initials: getInitials(name.trim()),
    color: getRandomColor(),
    createdAt: new Date().toISOString(),
    demoData: role === 'student' ? assignDemoData() : null
  };

  users.push(user);
  saveUsers(users);
  setSession(user);

  return { success: true, message: 'Registration successful!', user };
}

/**
 * Login a user
 * @returns {{ success: boolean, message: string, user?: object }}
 */
function login(email, password) {
  if (!email || !password) {
    return { success: false, message: 'Email and password are required.' };
  }

  if (!isValidEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const role = detectRole(email);
  if (!role) {
    return { 
      success: false, 
      message: 'Invalid email domain. Use @klh.edu.in (student) or @teacher.com (teacher).' 
    };
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    return { success: false, message: 'No account found with this email. Please register first.' };
  }

  if (user.password !== password) {
    return { success: false, message: 'Incorrect password. Please try again.' };
  }

  setSession(user);
  return { success: true, message: 'Login successful!', user };
}

/**
 * Logout current user
 */
function logout() {
  clearSession();
  window.location.href = 'login.html';
}

/**
 * Get current logged-in user
 */
function getCurrentUser() {
  return getSession();
}

/**
 * Page guard — require authentication
 * @param {string} requiredRole - 'student' or 'teacher'
 */
function requireAuth(requiredRole) {
  const user = getSession();
  
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to correct dashboard
    if (user.role === 'student') {
      window.location.href = 'student-dashboard.html';
    } else {
      window.location.href = 'teacher-dashboard.html';
    }
    return null;
  }

  return user;
}

/**
 * Redirect to appropriate dashboard based on role
 */
function redirectToDashboard(user) {
  if (user.role === 'student') {
    window.location.href = 'student-dashboard.html';
  } else if (user.role === 'teacher') {
    window.location.href = 'teacher-dashboard.html';
  }
}

/**
 * Get all students (for teacher dashboard)
 */
function getAllStudents() {
  return DEMO_STUDENT_DATA;
}

/**
 * Get password strength
 */
function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '' };
  
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: 'weak' };
  if (score <= 3) return { level: 2, label: 'Medium', color: 'medium' };
  return { level: 3, label: 'Strong', color: 'strong' };
}

// ── Initialize demo data if not exists ──
(function initDemoData() {
  const users = getUsers();
  if (users.length === 0) {
    // Pre-populate with some demo users so the system has data
    const demoUsers = [
      {
        id: '1001',
        name: 'Aarav Sharma',
        email: 'aarav@klh.edu.in',
        password: 'student123',
        role: 'student',
        initials: 'AS',
        color: '#4f8ef7',
        createdAt: new Date().toISOString(),
        demoData: {
          marks: 83, attend: 92, assign: 95,
          math: 85, science: 82, english: 78, social: 84, computer: 86,
          trend: [75, 78, 80, 81, 83, 85]
        }
      },
      {
        id: '1002',
        name: 'Priya Nair',
        email: 'priya@klh.edu.in',
        password: 'student123',
        role: 'student',
        initials: 'PN',
        color: '#22d3a0',
        createdAt: new Date().toISOString(),
        demoData: {
          marks: 91, attend: 97, assign: 98,
          math: 94, science: 90, english: 88, social: 89, computer: 94,
          trend: [85, 87, 88, 90, 91, 93]
        }
      },
      {
        id: '1003',
        name: 'Ms. Reddy',
        email: 'reddy@teacher.com',
        password: 'teacher123',
        role: 'teacher',
        initials: 'MR',
        color: '#22d3a0',
        createdAt: new Date().toISOString(),
        demoData: null
      }
    ];
    saveUsers(demoUsers);
  }
})();
