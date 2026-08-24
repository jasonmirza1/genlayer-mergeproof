export interface EvidenceLock {
  prCommit: string;
  gistRevision: string;
}

function githubPath(value: string, host: string, segments: number): string[] {
  const url = new URL(value.trim());
  const parts = url.pathname.split("/").filter(Boolean);
  const hostname = url.hostname.toLowerCase();
  const acceptedHosts = host === "github.com" ? [host, `www.${host}`] : [host];
  if (url.protocol !== "https:" || !acceptedHosts.includes(hostname) || parts.length !== segments) {
    throw new Error("Invalid public GitHub evidence URL.");
  }
  return parts;
}

async function githubJson(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    const suffix = response.status === 403 ? " GitHub API rate limit may have been reached." : "";
    throw new Error(`GitHub could not resolve this evidence (HTTP ${response.status}).${suffix}`);
  }
  return response.json();
}

export async function resolvePullRequestCommit(pullRequestUrl: string): Promise<string> {
  const [owner, repo, resource, number] = githubPath(pullRequestUrl, "github.com", 4);
  if (resource !== "pull" || !/^\d+$/.test(number)) {
    throw new Error("Use a numbered GitHub pull request URL.");
  }
  const data = await githubJson(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`);
  const sha = String(data?.head?.sha ?? "").toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error("GitHub did not return a full PR head commit.");
  return sha;
}

export async function resolveGistRevision(ownershipProofUrl: string): Promise<string> {
  const [, gistId] = githubPath(ownershipProofUrl, "gist.github.com", 2);
  const data = await githubJson(`https://api.github.com/gists/${gistId}`);
  const revision = String(data?.history?.[0]?.version ?? "").toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("GitHub did not return a full Gist revision.");
  return revision;
}
