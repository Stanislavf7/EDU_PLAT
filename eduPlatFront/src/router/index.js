import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';
import Home from '../components/Home.vue';
import Courses from '../components/Courses.vue';
import Overview from '../components/Overview.vue';
import Progress from '../components/CourseProgress.vue';
import Profile from '../components/Profile.vue';
import signup from '../components/signup.vue';
import Login from '../components/Login.vue';
import Recovery from '../components/Recovery.vue';
import About from '../components/About.vue';
import Contact from '../components/Contact.vue';
import AdminPanel from '../components/AdminPanel.vue';
import EditCourse from '../components/EditCourse.vue';
import EditProfile from '../components/EditProfile.vue';
import MakeCourse from '../components/MakeCourse.vue';
import CoursePreview from '../components/CoursePreview.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/courses', name: 'Courses', component: Courses },
  { path: '/courses/:id', name: 'Overview', component: Overview },
  {
    path: '/courses/:id/progress/:step',
    name: 'Progress',
    component: Progress,
    props: true,
    meta: { requiresAuth: true, role: ['creator', 'admin', 'user'] }
  },
  { path: '/profile', name: 'Profile', component: Profile },
  { path: '/signup', name: 'Signup', component: signup },
  { path: '/login', name: 'Login', component: Login },
  { path: '/recovery', name: 'Recovery', component: Recovery },
  { path: '/about', name: 'About', component: About },
  { path: '/contact', name: 'Contact', component: Contact },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/edit-course',
    name: 'EditCourse',
    component: EditCourse,
    meta: { requiresAuth: true, role: ['creator', 'admin'] }
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: EditProfile,
    meta: { requiresAuth: true, role: ['creator', 'admin', 'user'] }
  },
  {
    path: '/make-course/:courseId?/:step?',
    name: 'MakeCourse',
    component: MakeCourse,
    meta: { requiresAuth: true, role: ['creator', 'admin'] },
    props: true
  },
  {
    path: '/courses/:id/preview',
    name: 'CoursePreview',
    component: CoursePreview,
    meta: { requiresAuth: true, role: 'admin' }
  },
  { path: '/:catchAll(.*)', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  if (to.meta.requiresAuth) {
    if (!userStore.isAuthenticated) return next('/login');
    const allowedRoles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role];
    if (!allowedRoles.includes(userStore.role)) return next('/');
  }
  next();
});

export default router;