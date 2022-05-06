const fs = require("fs")

const args = process.argv.slice(2);


/**
 * Load JSON data, formatted by `tsc-output-parser`
 * 
 * In the GH Actions workflow we write two json files, one for the PR
 * branch and one for main (so that we can compare them).
 *
 */
const prData = JSON.parse(String(fs.readFileSync('./null_errors_pr.json')))
const mainData =JSON.parse(String(fs.readFileSync('./null_errors_main.json')))

const errorsOnMain = mainData.length
const errorsOnPR = prData.length

/**
 * Build up an object which maps error codes (like `TS2339`) to
 * a `Set` of all the messages we see for that code
 */
const getErrorCodeMessages = () => {
  let errorCodeMessageMap = {}

  prData.forEach((error) => {
    let errorCode = error.value.tsError.value.errorString
    let message = error.value.message.value
    errorCodeMessageMap[errorCode] = (errorCodeMessageMap[errorCode] ?? new Set).add(message)
  })

  return errorCodeMessageMap
}

const errorCodeMessages = getErrorCodeMessages()

/**
 * Build a map which just counts the entries in an array
 */
const countArrayEntries = xs => {
  let counts = new Map

  xs.forEach(x => {
    counts.set(x, (counts.get(x) ?? 0) + 1)
  })

  return counts
}

const fileErrorCounts = countArrayEntries(prData.map(error =>
  error.value.path.value
))

const errorCodeCounts = countArrayEntries(prData.map(error =>
  error.value.tsError.value.errorString
))


// Markdown formatting helpers
const collapsible = (title, contentCb, lineBreak = "\n") => {
  let out = [
    `<details><summary>${title}</summary>`,
    ""
  ]
  contentCb(out)
  out.push("")
  out.push("</details>")
  return out.join(lineBreak)
}

const tableHeader = (...colNames) => 
  [
    `| ${colNames.join(" | ")} |`,
    `| ${colNames.map(_ => "---").join(" | ")} |`
  ].join("\n")

const tableRow = (...entries) => "| " + entries.join(" | ") + " |"

/**
 * Helper function get a reverse-sort of the entries in our
 * 'count' maps (the return value of `countArrayEntries`)
 */
  const sortEntries = countMap => [...countMap.entries()].sort((a, b) => {
      if (a[1] < b[1]) {
        return 1
      }
      if (a[1] > b[1]) {
        return -1
      }
      return 0
    })


/**
 * Start formatting some Markdown to write out as a comment
 */
const lines = []

lines.push("### `--strictNullChecks` error report");
lines.push("");

lines.push(`Typechecking with \`--strictNullChecks\` resulted in ${prData.length} errors on this branch.`);
lines.push("")

// we can check the number of errors just to write a different message
// out here
if (errorsOnPR === errorsOnMain) {
  lines.push("That's the same number of errors on main, so at least we're not creating new ones!")
} else if (errorsOnPR < errorsOnMain) {
  lines.push(`That's ${errorsOnMain - errorsOnPR} fewer than on \`main\`! 🎉🎉🎉`)
} else {
  lines.push(`Unfortunately, it looks like that's an increase of ${errorsOnPR - errorsOnMain} over \`main\` 😞.`)
}

lines.push("");

// first we add details on the most error-prone files

lines.push("#### reports and statistics");
lines.push("");

lines.push(collapsible("Our most error-prone files", out => {
  out.push(tableHeader("Path", "Error Count"))

  sortEntries(fileErrorCounts)
    .slice(0, 20)
    .forEach(([path, errorCount]) => {
      out.push(tableRow(path, errorCount))
    })
}))

lines.push("")

lines.push(collapsible("Our most common errors", out => {
  out.push(tableHeader("Error code", "Count", "Error messages"))

  sortEntries(errorCodeCounts).forEach(([tsErrorCode, errorCount]) => {
    let messages = errorCodeMessages[tsErrorCode]

    out.push(tableRow(
      tsErrorCode, 
      errorCount,
      `<details><summary>Error messages</summary>${
        [...messages]
          .map(msg => msg.replaceAll("\n", "<br>"))
          .map(msg => msg.replaceAll("|", "\\|"))
          .join("<br>")
      }</details>`,
    ))
  })
}))

console.log(lines.join("\n"))
