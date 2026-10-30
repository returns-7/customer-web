// 데이터에는 'assets/...'(상대경로)로 들어 있으므로 화면에서는 항상 '/assets/...' 절대경로로 쓴다.
export const assetUrl = (path: string): string => {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('/')) return path
  return '/' + path
}
