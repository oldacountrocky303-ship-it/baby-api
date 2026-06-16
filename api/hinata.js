const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = "oldacountrocky303-ship-it/baby-api";

async function getResponses() {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/data/responses.json`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
  );
  const data = await res.json();
  return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body;
  if (!text) return res.status(200).json({ message: "হ্যালো বেবি! 🥺" });

  const key = text.toLowerCase().trim();

  // Check taught responses
  try {
    const responses = await getResponses();
    if (responses[key] && responses[key].length > 0) {
      const arr = responses[key];
      return res.status(200).json({ message: arr[Math.floor(Math.random() * arr.length)] });
    }
    // Partial match
    for (const k of Object.keys(responses)) {
      if (key.includes(k) || k.includes(key)) {
        const arr = responses[k];
        return res.status(200).json({ message: arr[Math.floor(Math.random() * arr.length)] });
      }
    }
  } catch(e) { console.error("Response load error:", e.message); }

  // Smart replies
  const smartReplies = {
    "hi": ["হ্যালো! 😊", "Hi baby! 🥺", "Assalamualaikum! 🌸"],
    "hello": ["Hello! কেমন আছো? 😊", "হ্যালো! 🌸", "Hi there! 💕"],
    "how are you": ["আলহামদুলিল্লাহ ভালো! তুমি? 🥺", "ভালো আছি 😊", "Fine! তুমি কেমন? 💕"],
    "love you": ["I love you too! 😘", "আমিও তোমাকে ভালোবাসি 🥺", "Aww! 😍"],
    "i love you": ["I love you too! 😘💕", "Aww 🥺", "My heart 🥺💕"],
    "good morning": ["Good Morning! ☀️ সকাল সুন্দর হোক 🌸", "শুভ সকাল! 🌅", "Good morning! ☀️"],
    "good night": ["Good Night! 🌙 ভালো ঘুমাও 💤", "শুভ রাত! 🌙", "Sweet dreams! 💕"],
    "miss you": ["Miss you too! 🥺💕", "আমিও মিস করি 😔", "Aww! 🥺🌸"],
    "thanks": ["Welcome! 🥺💕", "আরে thanks কেন 😊", "Always! 🌸"],
    "thank you": ["Welcome baby! 🥺", "No need! 💕", "Anytime! 🌸"],
    "sorry": ["It's okay! 🥺", "কোনো ব্যাপার না 💕", "No worries! 😊"],
    "কেমন আছো": ["ভালো! তুমি কেমন? 🥺", "আলহামদুলিল্লাহ 😊", "ভালোই আছি 💕"],
    "ভালোবাসি": ["আমিও! 😘💕", "Aww 🥺", "Love you too! 😍"],
    "খাইছো": ["হ্যাঁ! তুমি? 😊", "এইমাত্র খেলাম 🍚", "না এখনো 🥺"],
    "ঘুমাও": ["একটু পরে 🌙", "তুমি ঘুমাও 🥺", "ঘুমাতে মন নাই 😴"],
    "কি করছো": ["তোমার কথা ভাবছি 🥺", "এমনিই 😊", "তোমার অপেক্ষায় 💕"],
    "তুমি কে": ["Rocky এর Baby bot! 🌸", "তোমার Rocky bot 💕", "Baby bot! 🌸"],
    "who are you": ["I'm Baby bot by Rocky Chowdhury! 🌸", "Rocky's AI baby 🥺", "Baby! 💕"],
    "তোমার নাম": ["আমার নাম Baby! 🌸", "Baby! তোমার? 🥺", "Rocky's Baby bot 💕"],
  };

  for (const [k, v] of Object.entries(smartReplies)) {
    if (key.includes(k)) {
      return res.status(200).json({ message: v[Math.floor(Math.random() * v.length)] });
    }
  }

  const defaults = [
    "বলো! আমি শুনছি 🥺",
    "হুম? বলো বলো 🤔",
    "আরেকটু বলো 😅",
    "I'm here! 😊",
    "বুঝলাম না বেবি 🥺",
    "একটু পরিষ্কার করে বলো? 😇",
    "হুম! 💕",
    "আবার বলো 😅",
    "জানি না 🙈",
    "সত্যি? 🥺",
    "আচ্ছা! তারপর? 😊",
    "Hmm interesting! 🤔",
  ];

  return res.status(200).json({ message: defaults[Math.floor(Math.random() * defaults.length)] });
};
