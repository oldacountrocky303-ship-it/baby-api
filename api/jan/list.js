const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = "oldacountrocky303-ship-it/baby-api";

async function getFile(path) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
  );
  const data = await res.json();
  return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";
  const isAll = url.includes('/all');
  const isRaw = url.includes('/raw');

  try {

    // ── /api/jan/list/all → Teacher list with name + count ──
    if (isAll) {
      const teachers = await getFile("data/teachers.json");
      const names = await getFile("data/teacher-names.json").catch(() => ({}));

      const entries = Object.entries(teachers)
        .sort((a, b) => b[1] - a[1]);

      if (!entries.length) {
        return res.status(200).json({
          data: {},
          message: "👑 No teachers yet!"
        });
      }

      const medals = ["🥇", "🥈", "🥉"];
      let msg = `👑 𝐓𝐨𝐩 𝐓𝐞𝐚𝐜𝐡𝐞𝐫𝐬 𝐋𝐢𝐬𝐭\n`;
      msg += `━━━━━━━━━━━━━━━━\n`;
      msg += `👩‍🏫 Total teachers: ${entries.length}\n\n`;

      entries.slice(0, 20).forEach(([uid, count], i) => {
        const medal = medals[i] || `${i + 1}.`;
        const name = names[uid] || "Unknown";
        msg += `${medal} ${name}\n`;
        msg += `   🆔 ID: ${uid}\n`;
        msg += `   📚 Taught: ${count} replies\n\n`;
      });

      return res.status(200).json({ data: teachers, message: msg });
    }

    // ── /api/jan/list/raw → raw responses object ──
    if (isRaw) {
      const responses = await getFile("data/responses.json");
      return res.status(200).json({ data: responses });
    }

    // ── /api/jan/list → taught triggers + who taught each ──
    const responses = await getFile("data/responses.json");
    const names = await getFile("data/teacher-names.json").catch(() => ({}));
    const triggerMeta = await getFile("data/trigger-meta.json").catch(() => ({}));

    const keys = Object.keys(responses);

    if (!keys.length) {
      return res.status(200).json({ message: "📚 No triggers taught yet!" });
    }

    let msg = `📚 𝐓𝐚𝐮𝐠𝐡𝐭 𝐑𝐞𝐩𝐥𝐢𝐞𝐬 𝐋𝐢𝐬𝐭\n`;
    msg += `━━━━━━━━━━━━━━━━\n`;
    msg += `📊 Total triggers: ${keys.length}\n\n`;

    keys.slice(0, 25).forEach((k, i) => {
      const meta = triggerMeta[k] || {};
      const teacherName = meta.teacherName || "Unknown";
      const teacherUID = meta.teacherUID || "-";
      const count = responses[k].length;
      const sample = responses[k].slice(0, 2).join(", ");

      msg += `${i + 1}. 🔑 "${k}"\n`;
      msg += `   💬 Replies: ${count}\n`;
      msg += `   👤 Teacher: ${teacherName}\n`;
      msg += `   🆔 ID: ${teacherUID}\n`;
      msg += `   📝 Sample: ${sample}\n\n`;
    });

    if (keys.length > 25) msg += `...and ${keys.length - 25} more triggers`;

    return res.status(200).json({ message: msg });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
