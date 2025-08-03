import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { auth } from 'capacitor-auth-manager';
import App from './App.vue';
import './style.css';

// Import pages
import Home from './pages/Home.vue';
import Login from './pages/Login.vue';
import Profile from './pages/Profile.vue';

// Configure auth
auth.configure({
  providers: {
    google: {
      clientId:
        import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
    },
    github: {
      clientId:
        import.meta.env.VITE_GITHUB_CLIENT_ID || 'your-github-client-id',
    },
    facebook: {
      appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'your-facebook-app-id',
    },
    microsoft: {
      clientId:
        import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'your-microsoft-client-id',
    },
  },
  persistence: 'local',
  enableLogging: true,
});

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    {
      path: '/profile',
      component: Profile,
      meta: { requiresAuth: true },
    },
  ],
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = auth.getAuthState().isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

// Create app
const app = createApp(App);
app.use(router);
app.mount('#app');
