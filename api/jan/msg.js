const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "rocky-chowdhury-api/baby-api";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const userMessage = req.query.userMessage || "";
  const search = userMessage.replace("msg ", "").toLowerCase().trim();
  if (!search) return res.status(400).json({ message: "Please provide search term" });

  try {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/responses.json`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const d = await r.json();
    const data = JSON.parse(Buffer.from(d.content, 'base64').toString('utf8'));
    const keys = Object.keys(data).filter(k => k.includes(search));

    if (!keys.length) return res.status(200).json({ message: `❌ "${search}" not found in database` });

    let msg = `🔍 Found ${keys.length} result(s) for "${search}":\n\n`;
    keys.slice(0, 10).forEach((k, i) => {
      msg += `${i + 1}. "${k}":\n   ${data[k].slice(0, 3).join(", ")}\n`;
    });
    return res.status(200).json({ message: msg });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
