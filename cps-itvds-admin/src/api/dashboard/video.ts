import { defHttp } from '@/utils/http/axios.ts';
import { VideoListResult } from '@/api/sys/model/userModel';

enum Api {
  // Login = '/login',
  VIDEO_LIST = '/basic-api/fetchVideoList',
  VIDEO_FEED = '/basic-api/videoFeed',
}

// export function loginApi(params: LoginParams) {
//   return defHttp.request<LoginResultModel>({
//     url: Api.Login,
//     method: 'POST',
//     params,
//   });
// }

/**
 * @description: 获取视频列表
 */
export function getVideoList() {
  return defHttp.request<VideoListResult>({
    url: Api.VIDEO_LIST,
    method: 'POST',
  });
}

// interface PermissionInfo {
//   code: number;
//   info: {
//     roleName: string;
//     value: string;
//   };
// }

/**
 * @description: 获取视频流URL
 */
export function getVideoFeedUrl(videoId: string, permission_value: number): string {
  const baseUrl = `/basic-api/videoFeed?id=${videoId}`;
  const params = new URLSearchParams({
    permission_value: permission_value.toString(),
  });
  return `${baseUrl}&${params.toString()}`;
}
