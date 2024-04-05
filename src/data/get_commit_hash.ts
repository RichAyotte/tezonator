import { $ } from 'bun'

export async function get_commit_hash({
	tag,
	repo_path,
}: { tag: string; repo_path: string }) {
	return $`git rev-list -n 1 ${tag}`.cwd(repo_path).text()
}
