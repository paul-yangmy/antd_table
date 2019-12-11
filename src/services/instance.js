import request from '@/utils/request';

export async function query() {
  return request('/api/instance');
}
// export async function queryCurrent() {
//   return request('/api/currentUser');
// }
// export async function queryNotices() {
//   return request('/api/notices');
// }
