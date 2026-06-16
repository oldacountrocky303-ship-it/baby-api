const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = "oldacountrocky303-ship-it/baby-api";
const FILE_PATH = "data/responses.json";
const TEACHERS_PATH = "data/teachers.json";

const BLOCKED = [
  "sex","sexy","nude","naked","porn","xxx","boobs","dick","pussy","fuck",
  "choda","chudi","magi","beshya","randi","rape",
  "হাগা","চোদা","চুদি","মাগি","বেশ্যা","রান্ডি","নুড",
  "সেক্স","পর্ন","নগ্ন","যৌন","অশ্লীল","ধর্ষণ","18+","adult"
];

function isBlocked(text) {
  const lower = text.toLowerCase();
  return BLOCKED.some(w => lower.includes(w));
}

async function getFile(path) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }
  });
  const data = await res.json();
  return { content: JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')), sha: data.sha };
}

async function saveFile(path, content, sha, msg) {
  const { default: fetch } = await import('node-fetch');
  await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: msg,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      sha
    })
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { trigger, responses, userID } = req.body;
  if (!trigger || !responses) return res.status(400).json({ error: "trigger and responses required" });

  // 🚫 18+ block
  if (isBlocked(trigger) || isBlocked(responses)) {
    return res.status(403).json({
      error: "❌ 18+ বা অশ্লীল content teach করা যাবে না! 🚫\nRocky Chowdhury Bot এর নিয়ম বিরুদ্ধ।"
    });
  }

  try {
    const { content: data, sha } = await getFile(FILE_PATH);
    const key = trigger.toLowerCase().trim();
    if (!data[key]) data[key] = [];

    const newReplies = responses.split(",").map(r => r.trim()).filter(Boolean);

    for (const reply of newReplies) {
      if (isBlocked(reply)) {
        return res.status(403).json({ error: `❌ "${reply}" অশ্লীল content! 18+ allow নেই। 🚫` });
      }
    }

    data[key].push(...newReplies);
    await saveFile(FILE_PATH, data, sha, `teach: ${key}`);

    const { content: teachers, sha: tSha } = await getFile(TEACHERS_PATH);
    teachers[userID] = (teachers[userID] || 0) + newReplies.length;
    await saveFile(TEACHERS_PATH, teachers, tSha, `teacher: ${userID}`);

    return res.status(200).json({ success: true, count: data[key].length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
