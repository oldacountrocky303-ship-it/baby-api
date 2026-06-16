const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "rocky-chowdhury-api/baby-api";
const FILE_PATH = "data/responses.json";
const TEACHERS_PATH = "data/teachers.json";

// 18+ blocked words
const BLOCKED_WORDS = [
  "sex", "sexy", "nude", "naked", "porn", "xxx", "boobs", "dick",
  "pussy", "fuck", "choda", "chudi", "magi", "beshya", "randi",
  "হাগা", "চোদা", "চুদি", "মাগি", "বেশ্যা", "রান্ডি", "নুড",
  "সেক্স", "পর্ন", "নগ্ন", "যৌন", "অশ্লীল", "18+", "adult",
  "rape", "ধর্ষণ", "হস্তমৈথুন", "masturbat",
];

function isBlocked(text) {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(w => lower.includes(w));
}

async function getFile(filePath) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    }
  });
  const data = await res.json();
  return {
    content: JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')),
    sha: data.sha
  };
}

async function saveFile(filePath, content, sha, msg) {
  const { default: fetch } = await import('node-fetch');
  await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      'Content-Type': 'application/json'
    },
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

  // 🚫 18+ / blocked content check
  if (isBlocked(trigger) || isBlocked(responses)) {
    return res.status(403).json({
      error: "❌ 18+ বা অশ্লীল content teach করা যাবে না! এটি Rocky Chowdhury Bot এর নিয়ম বিরুদ্ধ। 🚫"
    });
  }

  try {
    const { content: data, sha } = await getFile(FILE_PATH);
    const key = trigger.toLowerCase().trim();

    if (!data[key]) data[key] = [];
    const newReplies = responses.split(",").map(r => r.trim()).filter(Boolean);

    // Check each reply for blocked content
    for (const reply of newReplies) {
      if (isBlocked(reply)) {
        return res.status(403).json({
          error: `❌ "${reply}" এই reply অশ্লীল! 18+ content allow নেই। 🚫`
        });
      }
    }

    data[key].push(...newReplies);
    await saveFile(FILE_PATH, data, sha, `teach: ${key}`);

    // Update teacher count
    const { content: teachers, sha: tSha } = await getFile(TEACHERS_PATH);
    teachers[userID] = (teachers[userID] || 0) + newReplies.length;
    await saveFile(TEACHERS_PATH, teachers, tSha, `teacher: ${userID}`);

    return res.status(200).json({ success: true, count: data[key].length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
