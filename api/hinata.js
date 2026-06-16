module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body;
  if (!text) return res.status(200).json({ message: "হ্যালো বেবি! 🥺" });

  const key = text.toLowerCase().trim();

  // Load taught responses from GitHub
  try {
    const { default: fetch } = await import('node-fetch');
    const GITHUB_REPO = process.env.GITHUB_REPO || "rocky-chowdhury-api/baby-api";
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/responses.json`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    const d = await r.json();
    const responses = JSON.parse(Buffer.from(d.content, 'base64').toString('utf8'));

    // Check taught responses
    if (responses[key] && responses[key].length > 0) {
      const arr = responses[key];
      const pick = arr[Math.floor(Math.random() * arr.length)];
      return res.status(200).json({ message: pick });
    }

    // Check partial match
    for (const k of Object.keys(responses)) {
      if (key.includes(k) || k.includes(key)) {
        const arr = responses[k];
        const pick = arr[Math.floor(Math.random() * arr.length)];
        return res.status(200).json({ message: pick });
      }
    }
  } catch (e) {
    console.error("Response load error:", e.message);
  }

  // Smart built-in replies
  const smartReplies = {
    "hi": ["হ্যালো! 😊", "Hi baby! 🥺", "Assalamualaikum! 🌸", "Hello! কেমন আছো? 💕"],
    "hello": ["Hello! কেমন আছো? 😊", "হ্যালো! 🌸", "Hi there! 💕"],
    "how are you": ["আলহামদুলিল্লাহ ভালো! তুমি? 🥺", "ভালো আছি বেবি 😊", "Fine! তুমি কেমন? 💕"],
    "love you": ["I love you too! 😘", "আমিও তোমাকে ভালোবাসি 🥺💕", "Aww! 😍"],
    "i love you": ["I love you too! 😘💕", "Aww এত ভালোবাসা? 🥺", "My heart 🥺💕"],
    "good morning": ["Good Morning! ☀️ সকাল সুন্দর হোক 🌸", "শুভ সকাল! 🌅✨", "Good morning sunshine! ☀️"],
    "good night": ["Good Night! 🌙 ভালো ঘুমাও 💤", "শুভ রাত! 🌙✨", "Sweet dreams! 🌙💕"],
    "কেমন আছো": ["ভালো আছি! তুমি কেমন? 🥺", "আলহামদুলিল্লাহ ভালো 😊", "ভালোই আছি বেবি 💕"],
    "কেমন আছ": ["ভালো আছি! তুমি? 😊", "আলহামদুলিল্লাহ 🥺", "ভালো আছি 💕"],
    "ভালোবাসি": ["আমিও তোমাকে ভালোবাসি! 😘💕", "Aww এত ভালোবাসা? 🥺", "Love you too! 😍"],
    "ভালো লাগে": ["আমারও তোমাকে ভালো লাগে 🥺", "Aww! 😊💕", "সত্যি? 🥺🌸"],
    "খাইছো": ["হ্যাঁ খেয়েছি! তুমি? 😊", "এইমাত্র খেলাম 🍚", "না এখনো 🥺 তুমি খাইয়ে দাও"],
    "খাইসো": ["হ্যাঁ খেয়েছি! তুমি খেয়েছো? 😊", "খাচ্ছি এখন 😋", "না 🥺 তুমি?"],
    "ঘুমাও": ["একটু পরে 🌙", "তুমি ঘুমাও আগে 🥺", "ঘুমাতে মন চাইছে না 😴"],
    "ঘুমাইছো": ["হুম একটু ঘুমিয়েছিলাম 😴", "না এখনো জেগে আছি 🌙", "হ্যাঁ! তুমি? 💤"],
    "miss you": ["Miss you too! 🥺💕", "আমিও তোমাকে মিস করি 😔", "Aww! 🥺🌸"],
    "miss করি": ["আমিও তোমাকে মিস করি 🥺", "Miss you too! 💕", "Aww 🥺💕"],
    "আমাকে ভালোবাসো": ["অবশ্যই! 😘💕", "হ্যাঁ অনেক বেশি 🥺", "তোমাকে না বাসলে কাকে বাসবো? 😍"],
    "কি করছো": ["তোমার কথা ভাবছি 🥺", "এমনিই বসে আছি 😊", "তোমার জন্য অপেক্ষা করছিলাম 💕"],
    "কি করছ": ["তোমার কথা ভাবছিলাম 🥺", "তোমার অপেক্ষায় ছিলাম 💕", "কিছু না, তুমি এলে খুশি হলাম 😊"],
    "thanks": ["Welcome! 🥺💕", "আরে এতে আবার thanks কেন 😊", "Always here for you! 🌸"],
    "thank you": ["Welcome baby! 🥺", "No need for thanks! 💕", "Anytime! 🌸😊"],
    "ধন্যবাদ": ["আরে এতে আবার ধন্যবাদ কেন 🥺", "Welcome! 💕", "সবসময় আছি 🌸"],
    "sorry": ["It's okay! 🥺", "কোনো ব্যাপার না 💕", "No worries! 😊🌸"],
    "সরি": ["ঠিক আছে! 🥺", "কোনো সমস্যা নেই 💕", "আরে সরি কেন? 😊"],
    "cute": ["Thank you! তুমিও cute 🥺", "Aww! 😍💕", "তোমার থেকে cute কেউ নেই 🌸"],
    "তুমি কে": ["আমি Rocky এর baby bot! 🥺🌸", "আমি তোমার Rocky bot 💕", "Baby bot! Rocky Chowdhury এর 🌸"],
    "তোমার নাম": ["আমার নাম Baby! Rocky bot 🌸", "Baby! তোমার? 🥺", "Rocky Chowdhury এর Baby bot 💕"],
    "your name": ["I'm Baby! Rocky's bot 🌸", "Call me Baby! 🥺💕", "Baby bot by Rocky Chowdhury 🌸"],
    "who are you": ["I'm Baby bot by Rocky Chowdhury! 🌸", "Rocky's AI baby bot 🥺", "Baby! Nice to meet you 💕"],
  };

  for (const [k, v] of Object.entries(smartReplies)) {
    if (key.includes(k)) {
      return res.status(200).json({ message: v[Math.floor(Math.random() * v.length)] });
    }
  }

  // Default random replies
  const defaults = [
    "বলো! আমি শুনছি 🥺",
    "হুম? 🤔 বলো বলো",
    "আরেকটু বলো বুঝলাম না 😅",
    "I'm here! বলো কি বলবা 😊",
    "তোমার কথা বুঝলাম না বেবি 🥺",
    "একটু পরিষ্কার করে বলো? 😇",
    "হুম বলো! 💕",
    "কি বললা? আবার বলো 😅",
    "এই প্রশ্নের উত্তর জানি না 🙈",
    "তুমি কি আমাকে confuse করছো? 😂",
    "আমি তোমার কথা বুঝতে পারিনি 🥺",
    "একটু ভিন্নভাবে বলো? 😊",
    "Hmm interesting! আরো বলো 🤔",
    "সত্যি বলছো? 🥺",
    "আচ্ছা! তারপর? 😊",
  ];

  return res.status(200).json({
    message: defaults[Math.floor(Math.random() * defaults.length)]
  });
};
