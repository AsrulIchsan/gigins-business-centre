const fs = require("fs");
const http = require("isomorphic-git/http/node");
const git = require("isomorphic-git");

async function push(remoteUrl, token) {
  const dir = process.cwd();
  console.log(`🚀 Menghubungkan ke remote: ${remoteUrl}...`);

  await git.push({
    fs,
    http,
    dir,
    url: remoteUrl,
    ref: "main",
    force: false,
    onAuth: () => ({
      username: token,
      password: "",
    }),
  });

  console.log("✅ Berhasil push ke GitHub main branch!");
}

const args = process.argv.slice(2);
const remoteUrl = args[0] || process.env.GITHUB_REPO_URL;
const token = args[1] || process.env.GITHUB_TOKEN;

if (!remoteUrl) {
  console.log("Penggunaan: node scripts/git-push.js <REMOTE_URL> <GITHUB_TOKEN>");
  process.exit(1);
}

push(remoteUrl, token).catch((err) => {
  console.error("❌ Gagal push ke GitHub:", err.message);
  process.exit(1);
});
