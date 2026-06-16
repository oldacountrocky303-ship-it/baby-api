const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "rocky-chowdhury-api/baby-api";
const FILE_PATH = "data/responses.json";

async function getFile() {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }
  });
  const data = await res.json();
  return {
    content: JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')),
    sha: data.sha
  };
}

async function saveFile(content, sha) {
  const { default: fetch } = await import('node-fetch');
  await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "remove response",
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      sha
    })
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  const { trigger, index } = req.body;
  if (!trigger || index === undefined) return res.status(400).json({ error: "trigger and index required" });

  try {
    const { content: data, sha } = await getFile();
    const key = trigger.toLowerCase().trim();
    if (!data[key] || data[key][index] === undefined) {
      return res.status(404).json({ message: `❌ Index ${index} not found for "${key}"` });
    }
    const removed = data[key].splice(index, 1);
    if (data[key].length === 0) delete data[key];
    await saveFile(data, sha);
    return res.status(200).json({ message: `✅ Removed "${removed[0]}" from "${key}"` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
