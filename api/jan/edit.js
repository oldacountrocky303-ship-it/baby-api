const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "rocky-chowdhury-api/baby-api";
const FILE_PATH = "data/responses.json";

const BLOCKED_WORDS = [
  "sex","sexy","nude","naked","porn","xxx","boobs","dick","pussy","fuck",
  "choda","chudi","magi","beshya","randi","হাগা","চোদা","চুদি","মাগি",
  "বেশ্যা","রান্ডি","নুড","সেক্স","পর্ন","নগ্ন","যৌন","অশ্লীল","rape","ধর্ষণ"
];

function isBlocked(text) {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(w => lower.includes(w));
}

async function getFile() {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
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
      message: "edit response",
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      sha
    })
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  const { oldTrigger, newResponse } = req.body;
  if (!oldTrigger || !newResponse) return res.status(400).json({ error: "oldTrigger and newResponse required" });

  if (isBlocked(oldTrigger) || isBlocked(newResponse)) {
    return res.status(403).json({ error: "❌ 18+ content edit করা যাবে না! 🚫" });
  }

  try {
    const { content: data, sha } = await getFile();
    const key = oldTrigger.toLowerCase().trim();
    if (!data[key]) return res.status(404).json({ error: `"${key}" not found` });
    data[key] = [newResponse];
    await saveFile(data, sha);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
