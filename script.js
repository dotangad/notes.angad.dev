const fs = require("fs/promises");
const shell = require("shelljs");
const cliProgress = require("cli-progress");
const {
  PAGE_TEMPLATE,
  INDEX_TEMPLATE,
  parseFile,
  writeFile,
} = require("./helpers");

require("draftlog").into(console);

const { NOTES_DIR, DIST_PATH } = process.env;

(async function () {
  try {
    shell.rm("-r", `${DIST_PATH}/*`);
    shell.cp("-R", "./static/", DIST_PATH);

    const files = await fs.readdir(NOTES_DIR);
    const index = [];
    let written = 0;

    const update = console.draft("Starting...");

    for (let i in files) {
      const filename = files[i];
      const progress = `${String(parseInt(i) + 1).padStart(
        String(files.length).length,
        "0"
      )}/${files.length - 1}   `;

      update(progress + filename);
      const { html, link, title, date, publish, list, rc } = await parseFile(
        filename
      );

      if (publish) {
        if (list) index.push({ link, title, date });

        await writeFile(PAGE_TEMPLATE(title, date, html, rc), link);
        written++;
      }
    }

    await writeFile(INDEX_TEMPLATE(index.reverse()), "index.html");

    update(`${written} files generated, ${index.length} in index`);
  } catch (e) {
    console.error(e);
  }
})();
