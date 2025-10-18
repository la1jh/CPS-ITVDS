import { defHttp } from '@/utils/http/axios.ts';

export interface LogItem {
  appointent_date: string;
  vehical_plate: string;
  path_id: string;
}

enum Api {
  GetAppointments = '/basic-api/fetchAppointmentList',
}

/**
 * 获取系统日志
 * @returns Promise<LogItem[]>
 */
export function getAppointments() {
  return defHttp.post<LogItem[]>({
    url: Api.GetAppointments,
  });
}
