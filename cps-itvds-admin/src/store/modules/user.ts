import { defineStore } from 'pinia';
import { defHttp } from '@/utils/http/axios.ts';
import { RoleEnum } from '@/enums/roleEnum';
import { getAuthCache, setAuthCache } from '@/utils/auth';
import { TOKEN_KEY, USER_INFO_KEY } from '@/enums/cacheEnum';
import { GetUserInfoModel, RoleInfo } from '@/api/sys/model/userModel';
import { getUserInfo } from '@/api/sys/user';
import { usePermissionStore } from './permission';
import { PAGE_NOT_FOUND_ROUTE } from '@/router/routes/basic';
import { RouteRecordRaw } from 'vue-router';
import { router } from '@/router';
import { PageEnum } from '@/enums/pageEnum';
import { store } from '@/store';
import { doLogout } from '@/api/sys/user';
import { useMessage}  from '@/hooks/web/useMessage';
import { useI18n } from '@/hooks/web/useI18n';
import { h } from 'vue';

interface UserInfo {
  userId: string | number;
  username: string;
  realName: string;
  avatar: string;
  desc?: string;
  homePath?: string;
  roles: RoleInfo[];
}

type Nullable<T> = T | null;

interface UserState {
  userInfo: Nullable<UserInfo>;
  token?: string;
  roleList: RoleEnum[];
  sessionTimeout?: boolean;
  lastUpdateTime: number;
}

export interface LoginParams {
  username: string;
  password: string;
  loginType: 'user' | 'admin';
}

interface RegisterParams {
  username: string;
  password: string;
}

interface VerifyFaceParams {
  image: string;
}

export const useUserStore = defineStore('app-user', {
  state: (): UserState => ({
    userInfo: null,
    token: undefined,
    roleList: [],
    sessionTimeout: false,
    lastUpdateTime: 0,
  }),

  getters: {
    getUserInfo(state): UserInfo {
      return state.userInfo || getAuthCache<UserInfo>(USER_INFO_KEY) || {};
    },
    getToken(state): string {
      return state.token || getAuthCache<string>(TOKEN_KEY);
    }
  },

  actions: {
    setToken(token: string | undefined) {
      this.token = token ? token : '';
      setAuthCache(TOKEN_KEY, token);
    },
    setUserInfo(info: UserInfo | null) {
      this.userInfo = info;
      this.lastUpdateTime = new Date().getTime();
      setAuthCache(USER_INFO_KEY, info);
    },
    setSessionTimeout(flag: boolean) {
      this.sessionTimeout = flag;
    },
    resetState() {
      this.userInfo = null;
      this.token = '';
      this.roleList = [];
      this.sessionTimeout = false;
    },
    async register(params: RegisterParams) {
      return await defHttp.post(
        {
          url: '/basic-api/register',
          data: params,
        },
      );
    },

    async login(params: LoginParams & { image?: string }) {
      try {
        const { username, password, loginType, image } = params;
        const requestData: any = {
          username,
          password,
          loginType,
        };

        if (loginType === 'admin' && image) {
          requestData.image = image;
        }

        const response = await defHttp.post({
          url: '/basic-api/login',
          data: requestData,
        });

        const { token } = response;
        this.setToken(token);
        return this.afterLoginAction();
      } catch (error) {
        return Promise.reject(error);
      }
    },
    async logout(goLogin = false) {
      if (this.getToken) {
        try {
          await doLogout();
        } catch {
          console.log('注销Token失败');
        }
      }
      this.setToken(undefined);
      this.setSessionTimeout(false);
      this.setUserInfo(null);
      if (goLogin) {
        // 直接回登陆页
        router.replace(PageEnum.BASE_LOGIN);
      } else {
        // 回登陆页带上当前路由地址
        router.replace({
          path: PageEnum.BASE_LOGIN,
          query: {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          },
        });
      }
    },
    async verifyFace(params: VerifyFaceParams) {
      return await defHttp.post(
        {
          url: '/basic-api/verifyFace',
          data: {
            image: params.image
          },
        },
      );
    },
    async getUserInfoAction(): Promise<UserInfo | null> {
      if(!this.getToken) return null;
      const userInfo = await defHttp.get({url: '/basic-api/getUserInfo'},{errorMessageMode:"none"});
      this.setUserInfo(userInfo);
      return userInfo;
    },
    async afterLoginAction(): Promise<GetUserInfoModel | null> {
      if (!this.getToken) return null;
      const userInfo = await this.getUserInfoAction();
      const sessionTimeout = this.sessionTimeout;
      if(sessionTimeout) {
        this.setSessionTimeout(false);
      } else {
        const permissionStore = usePermissionStore();

        if(!permissionStore.isDynamicAddedRoute) {
          const routes = await permissionStore.buildRoutesAction();
          [...routes, PAGE_NOT_FOUND_ROUTE].forEach((route) => {
            router.addRoute(route as unknown as RouteRecordRaw);
          });
          permissionStore.setDynamicAddedRoute(true);
        }

        await router.replace(userInfo?.homePath || PageEnum.BASE_HOME);
      }
      return userInfo;
    },
    confirmLoginOut() {
      const { createConfirm } = useMessage();
      const { t } = useI18n();
      createConfirm({
        iconType: 'warning',
        title: () => h('span', t('sys.app.logoutTip')),
        content: () => h('span', t('sys.app.logoutMessage')),
        onOk: async () => {
          // 主动登出，不带redirect地址
          await this.logout(true);
        },
      });
    },
  },
});

export function useUserStoreWithOut() {
  return useUserStore(store);
}