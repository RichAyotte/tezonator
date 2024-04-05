export const data_path_types = ['node', 'client', 'dal'] as const
export type DataPathType = (typeof data_path_types)[number]
