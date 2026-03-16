const https = require(“https”);

// ── Config (variables d’environnement Netlify) ────────────
const FEDAPAY_SK    = process.env.FEDAPAY_SECRET_KEY;
const PDF_LINK      = process.env.PDF_DOWNLOAD_LINK;
const GMAIL_USER    = process.env.GMAIL_USER;
const GMAIL_PASS    = process.env.GMAIL_APP_PASSWORD;

// ── Helper GET HTTPS ──────────────────────────────────────
function httpsGet(hostname, path, headers) {
return new Promise((resolve, reject) => {
const req = https.request(
{ hostname, path, method: “GET”, headers },
(res) => {
let raw = “”;
res.on(“data”, (c) => (raw += c));
res.on(“end”, () => {
try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
catch { resolve({ status: res.statusCode, body: raw }); }
});
}
);
req.on(“error”, reject);
req.end();
});
}

// ── Envoi email via Gmail SMTP ────────────────────────────
async function sendEmail(to, customerName) {
const nodemailer = require(“nodemailer”);

const transporter = nodemailer.createTransport({
service: “gmail”,
auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

const htmlBody = `

<!DOCTYPE html>

<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050508;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050508;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td height="4" style="background:#9040c8;border-radius:4px 4px 0 0;"></td></tr>
        <tr><td style="background:#0d0b12;padding:40px 36px;border:1px solid #1a1525;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 24px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#a87fd4;">BRICE DIGITZ</p>
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#e8e0f0;line-height:1.2;">Paiement confirmé 🎉</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#aaa;line-height:1.7;">
            Bonjour <strong style="color:#e8e0f0;">${customerName}</strong>,<br><br>
            Ton paiement a bien été reçu. Voici ton accès immédiat aux
            <strong style="color:#e8e0f0;">10 Prompts Master</strong>.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
            <tr>
              <td align="center" style="background:#9040c8;border-radius:4px;">
                <a href="${PDF_LINK}" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                  Télécharger mon PDF →
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 32px;font-size:12px;color:#7a6e8a;line-height:1.6;">
            Lien de secours :<br>
            <a href="${PDF_LINK}" style="color:#a87fd4;word-break:break-all;">${PDF_LINK}</a>
          </p>
          <hr style="border:none;border-top:1px solid #1a1525;margin:0 0 24px;">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#7a6e8a;">CE QUE TU AS OBTENU</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td style="padding:5px 0;font-size:13px;color:#ccc;">🏗 L'Architecte de Business</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#ccc;">🎓 Le Tuteur Socratique</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#ccc;">✍ Le Copywriter de Vente</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#ccc;">📋 Le Planificateur de Contenu</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#ccc;">🔍 Le Détective de Marché</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#ccc;">🤖 L'Automatiseur de Tâches</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#ccc;">💬 Le Coach de Closing</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#ccc;">🪞 L'Éditeur Sans Pitié</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#ccc;">🎯 Le Stratège de Lancement</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#ccc;">🧬 Le Clonateur de Style</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #1a1525;margin:24px 0;">
          <p style="margin:0;font-size:13px;color:#7a6e8a;line-height:1.7;">
            Des questions ? Réponds directement à cet email.<br>
            Merci de ta confiance.<br><br>
            <strong style="color:#a87fd4;">Brice Digitz</strong><br>
            <span style="color:#555;">AI Workflow Consultant · Abomey-Calavi, Bénin</span>
          </p>
        </td></tr>
        <tr><td align="center" style="padding:20px 0;">
          <p style="margin:0;font-size:11px;color:#333;">© 2026 Brice Digitz · Tous droits réservés</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

await transporter.sendMail({
from: `"Brice Digitz" <${GMAIL_USER}>`,
to,
subject: “🎉 Tes 10 Prompts Master sont prêts !”,
html: htmlBody,
});
}

// ── Handler principal ─────────────────────────────────────
exports.handler = async (event) => {
if (event.httpMethod !== “POST”) {
return { statusCode: 405, body: “Method Not Allowed” };
}

let payload;
try { payload = JSON.parse(event.body); }
catch { return { statusCode: 400, body: “Invalid JSON” }; }

const { name, data } = payload;

if (name !== “transaction.approved”) {
return { statusCode: 200, body: “Événement ignoré” };
}

const transactionId = data?.id;
if (!transactionId) {
return { statusCode: 400, body: “Transaction ID manquant” };
}

const verify = await httpsGet(
“api.fedapay.com”,
`/v1/transactions/${transactionId}`,
{ Authorization: `Bearer ${FEDAPAY_SK}`, “Content-Type”: “application/json” }
);

if (verify.status !== 200) {
return { statusCode: 500, body: “Erreur vérification FedaPay” };
}

const transaction   = verify.body?.v1?.transaction;
const status        = transaction?.status;
const customerEmail = transaction?.customer?.email;
const customerName  = transaction?.customer?.firstname || “cher client”;

if (status !== “approved”) {
return { statusCode: 200, body: `Statut : ${status}` };
}

if (!customerEmail) {
return { statusCode: 400, body: “Email client manquant” };
}

await sendEmail(customerEmail, customerName);

console.log(`Email envoyé à ${customerEmail}`);
return { statusCode: 200, body: “OK” };
};
