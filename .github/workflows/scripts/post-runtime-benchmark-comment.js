const fs = require('fs');

const MARKER = '<!-- runtime-benchmark-report -->';

module.exports = async ({ github, context, prNumber }) => {
  const pr = JSON.parse(fs.readFileSync('pr-raw.json', 'utf-8'));
  const base = JSON.parse(fs.readFileSync('base-raw.json', 'utf-8'));
  const baseByName = Object.fromEntries(base.map((entry) => [entry.name, entry]));

  let body = `${MARKER}\n## Runtime Benchmark\n\n| Operation | Base | PR | Change |\n|---|---|---|---|\n`;
  for (const entry of pr) {
    const baseEntry = baseByName[entry.name];
    if (!baseEntry) {
      body += `| ${entry.name} | - | ${entry.value.toFixed(2)}ms | - |\n`;
      continue;
    }
    const change = ((entry.value - baseEntry.value) / baseEntry.value) * 100;
    const arrow = change > 0 ? '🔺' : '🔻';
    body += `| ${entry.name} | ${baseEntry.value.toFixed(2)}ms | ${entry.value.toFixed(2)}ms | ${arrow} ${change.toFixed(1)}% |\n`;
  }

  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
  });
  const existing = comments.find((comment) => comment.body.includes(MARKER));

  if (existing) {
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
      body,
    });
  }
};
