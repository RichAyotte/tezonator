export function is_item_in_set<T>(item: unknown, set: Set<T>): item is T {
	return set.has(item as T)
}
