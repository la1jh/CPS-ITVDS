import type { AppRouteModule } from '@/router/types';
import { LAYOUT } from '@/router/constant';

const sys: AppRouteModule = {
  path: '/sys',
  name: 'Sys',
  component: LAYOUT,
  meta: {
    orderNo: 2000,
    icon: 'ion:settings-outline',
    title: '系统日志管理',
  },
  children: [
    {
      path: 'log',
      name: 'Log',
      component: () => import('@/views/sys/log_new/index.vue'),
      meta: {
        title: '日志管理',
        icon: 'material-symbols:format-list-bulleted',
      },
    },
  ],
};

export default sys;