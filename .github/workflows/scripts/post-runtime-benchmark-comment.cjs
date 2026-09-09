const fs = require('fs');

const MARKER = '<!-- runtime-benchmark-report -->';
const TOLERANCE_PERCENT = 30;

module.exports = async ({ github, context, prNumber }) => {
  const pr = JSON.parse(fs.readFileSync('pr-raw.json', 'utf-8'));
  const base = JSON.parse(fs.readFileSync('base-raw.json', 'utf-8'));
  const baseByName = Object.fromEntries(base.map((entry) => [entry.name, entry]));

  const rows = [];
  let untouched = 0;
  let improved = 0;
  let regressed = 0;

  for (const entry of pr) {
    const baseEntry = baseByName[entry.name];
    if (!baseEntry) continue;

    const change = ((entry.value - baseEntry.value) / baseEntry.value) * 100;
    if (Math.abs(change) < TOLERANCE_PERCENT) {
      untouched++;
      continue;
    }

    const arrow = change > 0 ? '🔺' : '🔻';
    if (change > 0) {
      regressed++;
    } else {
      improved++;
    }
    rows.push(
      `| ${entry.name} | ${baseEntry.value.toFixed(2)}ms | ${entry.value.toFixed(2)}ms | ${arrow} ${change.toFixed(1)}% |`,
    );
  }

  let body = `${MARKER}\n## Runtime Benchmark\n\n`;
  body += `- ${untouched} untouched benchmark${untouched === 1 ? '' : 's'}\n`;
  body += `- ${improved} improved benchmark${improved === 1 ? '' : 's'}\n`;
  body += `- ${regressed} regressed benchmark${regressed === 1 ? '' : 's'}\n`;

  if (rows.length > 0) {
    body += `\n### Performance changes\n\n| Operation | Base | PR | Change |\n|---|---|---|---|\n${rows.join('\n')}\n`;
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
