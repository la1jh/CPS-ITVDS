import { defHttp } from '@/utils/http/axios.ts';

export interface LogItem {
  vehical_plate: string;
  date: string;
  position: string;
  vehicle_type: string;
  average_speed: string | number;
  movement: string;
}

enum Api {
  GetSystemLogs = '/basic-api/fetchLogData',
}

/**
 * 获取系统日志
 * @returns Promise<LogItem[]>
 */
export function getSystemLogs() {
  return defHttp.post<LogItem[]>({
    url: Api.GetSystemLogs,
  });
}
