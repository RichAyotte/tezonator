export const service_names = ['node', 'baker', 'accuser', 'dal'] as const
export type ServiceName = (typeof service_names)[number]
