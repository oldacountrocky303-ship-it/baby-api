const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = "oldacountrocky303-ship-it/baby-api";

async function getFile(path) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }
  });
  const data = await res.json();
  return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const isAll = req.url.includes('/all');

  try {
    if (isAll) {
      const teachers = await getFile("data/teachers.json");
      return res.status(200).json({ data: teachers });
    }
    const responses = await getFile("data/responses.json");
    const keys = Object.keys(responses);
    let msg = `📚 Total taught: ${keys.length} triggers\n\n`;
    keys.slice(0, 30).forEach((k, i) => {
      msg += `${i + 1}. "${k}" → ${responses[k].length} replies\n`;
    });
    if (keys.length > 30) msg += `\n...and ${keys.length - 30} more`;
    return res.status(200).json({ message: msg });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
