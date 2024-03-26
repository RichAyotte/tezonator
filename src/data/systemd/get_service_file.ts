import path from 'node:path'
import { file } from 'bun'

export type ServiceName = 'node' | 'baker' | 'accuser'
export type GetServiceFileInput = { service_name: ServiceName }

export async function get_service_file({
	service_name,
}: GetServiceFileInput): Promise<string> {
	const file_path = path.join(import.meta.dir, `${service_name}.service`)
	return file(file_path).text()
}
