// className 합치기 (false·undefined는 건너뜀)
export const cx = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(' ')
