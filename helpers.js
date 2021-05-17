const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");
const markdown = require("markdown-wasm");

const { NOTES_DIR, DIST_PATH } = process.env;

const PAGE_TEMPLATE = (title, date, content, rc) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="static/css/style.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/default.min.css">
    <title>${title}</title>
  </head>
  <body>
    <div class="container">
      <div class="nav">
        <a href="./" class="back">&lt;\-\- Back to Index</a>
      </div>

      <div class="date">${date}</div>

      <div class="content">${content}</div>
    </div>
    <footer>
      ${rc ? `<div class="rc-scout"></div>` : ""}
      <div>&copy; <a href="https://angad.dev/">Angad Singh</a> 2021-</div>
    </footer>

    ${
      rc
        ? `<script async defer src="https://www.recurse-scout.com/loader.js?t=86d76fd73a1916306be7e1b86b9685fa"></script>`
        : ""
    }
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/highlight.min.js"></script>
    <script>
      hljs.highlightAll();
    </script>
  </body>
</html>
`;

const INDEX_TEMPLATE = (index) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="static/css/style.css" />
    <title>Angad's Notes</title>
  </head>
  <body>
    <div class="container">
      <h1>Angad's Notes</h1>
      <p>
        Miscellaneous thoughts and lessons learned while programming (usually
        the hard way).
      </p>

      <div class="posts">
      ${index
        .map(
          (post) => `<a href=\"${post.link}\" class="post">
          <span class="date">${post.date}</span> ${post.title}
        </a>`
        )
        .join("")}
      </div>
    </div>
    <footer>
      <div class="rc-scout"></div>
      <div>&copy; <a href="https://angad.dev/">Angad Singh</a> 2021-</div>
    </footer>

    <script
      async
      defer
      src="https://www.recurse-scout.com/loader.js?t=86d76fd73a1916306be7e1b86b9685fa"
    ></script>
  </body>
</html>`;

function parseHTML(content) {
  return markdown.parse(
    content
      // Replace internal links
      .replace(
        /\[\[\.\/(?<filename>(?<date>\d{4}-\d{2}-\d{2})(?<title>.*).md)\]\]/gm,
        (...args) => {
          const { date, title, filename } = args[args.length - 1];

          if (!title.trim()) {
            return `<a href="/${filename}">${date}</a>`;
          } else {
            return `<a href="/${filename}">${title.trim()}</a>`;
          }
        }
      )
      // Replace timestamps
      .replace(
        /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2} \w+)$/gm,
        (match) => `<h2 class="timestamp">${match}</h2>`
      )
  );
}

async function parseFile(filename) {
  const fileContents = (
    await fs.readFile(path.join(NOTES_DIR, filename))
  ).toString();
  const { content, data } = matter(fileContents);

  if (!data["publish"]) {
    return { html: null, title: null, date: null, publish: false, list: false };
  }

  const fileRegex = /^(?<d>\d{4}-\d{2}-\d{2})(?<t>.*).md$/gm.exec(filename);

  if (!fileRegex["groups"] || !fileRegex["groups"].d) {
    throw new Error("Filename did not parse");
  }

  return {
    html: parseHTML(content),
    link: path.basename(filename.replace(/\ /g, "_"), ".md") + ".html",
    date: fileRegex["groups"].d.trim(),
    title: fileRegex["groups"].t ? fileRegex["groups"].t.trim() : this.date,
    publish: true,
    list: !data["unlisted"],
    rc: !!data["rc"],
  };
}

function writeFile(html, filename) {
  return fs.writeFile(path.join(DIST_PATH, filename), html);
}

async function emptyDir(dir) {
  const files = await fs.readdir(dir);

  return Promise.all(
    files.map((filename) => fs.unlink(path.join(dir, filename)))
  );
}

module.exports = {
  PAGE_TEMPLATE,
  INDEX_TEMPLATE,
  parseHTML,
  parseFile,
  writeFile,
  emptyDir,
};
