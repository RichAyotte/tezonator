export interface SafeGetMap<K, V> extends Map<K, V> {
	get(key: K): V
}

export function get_safe_map_handler<K, V>() {
	return {
		get: (target: Map<K, V>, prop: keyof Map<K, V>, receiver: Map<K, V>) => {
			if (prop === 'get') {
				return (key: K) => {
					const value = target.get(key)
					if (typeof value !== 'string') {
						throw new Error(`Key "${key}" not found in map.`)
					}
					return value
				}
			}
			return Reflect.get(target, prop, receiver)
		},
	}
}

// FIXME - not sure how to get rid of the `as SafeGetMap<K, V>`...
export function get_safe_map<K, V>(entries: [K, V][]): SafeGetMap<K, V> {
	// FIXME Bun bug, it can't do new Proxy() ...
	// maybe related to https://github.com/oven-sh/bun/issues/7202
	// return new Proxy(
	// 	new Map<K, V>(entries),
	// 	get_safe_map_handler<K, V>(),
	// ) as SafeGetMap<K, V>
	return new Map<K, V>(entries) as SafeGetMap<K, V>
}
