const https = require(“https”);

// ── Config ────────────────────────────────────────────────
const RESEND_API_KEY  = process.env.RESEND_API_KEY;
const FEDAPAY_SK      = process.env.FEDAPAY_SECRET_KEY;
const PDF_LINK        = process.env.PDF_DOWNLOAD_LINK;
const FROM_EMAIL      = “Brice Digitz [bricehodonou90@gmail.com](mailto:bricehodonou90@gmail.com)”;

// ── Helper : requête HTTPS simple ────────────────────────
function httpsPost(hostname, path, headers, body) {
return new Promise((resolve, reject) => {
const data = JSON.stringify(body);
const req = https.request(
{ hostname, path, method: “POST”,
headers: { …headers, “Content-Length”: Buffer.byteLength(data) } },
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
req.write(data);
req.end();
});
}

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

// ── Handler principal ─────────────────────────────────────
exports.handler = async (event) => {
// Accepter uniquement les POST
if (event.httpMethod !== “POST”) {
return { statusCode: 405, body: “Method Not Allowed” };
}

let payload;
try {
payload = JSON.parse(event.body);
} catch {
return { statusCode: 400, body: “Invalid JSON” };
}

const { name, data } = payload;

// On n’agit que sur les transactions approuvées
if (name !== “transaction.approved”) {
return { statusCode: 200, body: “Event ignoré” };
}

const transactionId = data?.id;
if (!transactionId) {
return { statusCode: 400, body: “Transaction ID manquant” };
}

// ── Vérifier la transaction via l’API FedaPay ──────────
const verify = await httpsGet(
“api.fedapay.com”,
`/v1/transactions/${transactionId}`,
{
Authorization: `Bearer ${FEDAPAY_SK}`,
“Content-Type”: “application/json”,
}
);

if (verify.status !== 200) {
console.error(“Erreur vérification FedaPay”, verify.body);
return { statusCode: 500, body: “Erreur vérification paiement” };
}

const transaction = verify.body?.v1?.transaction;
const status      = transaction?.status;
const customerEmail = transaction?.customer?.email;
const customerName  = transaction?.customer?.firstname || “cher client”;

// Double vérification du statut
if (status !== “approved”) {
return { statusCode: 200, body: `Statut non approuvé : ${status}` };
}

if (!customerEmail) {
console.error(“Email client introuvable dans la transaction”);
return { statusCode: 400, body: “Email client manquant” };
}

// ── Envoyer l’email via Resend ─────────────────────────
const emailBody = {
from: FROM_EMAIL,
to: [customerEmail],
subject: “🎉 Tes 10 Prompts Master sont prêts !”,
html: `

<!DOCTYPE html>

<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#050508;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050508;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

```
      <!-- Barre top -->
      <tr>
        <td height="4" style="background:linear-gradient(90deg,#9040c8,#a87fd4,#9040c8);border-radius:4px 4px 0 0;"></td>
      </tr>

      <!-- Corps -->
      <tr>
        <td style="background:#0d0b12;padding:40px 36px;border:1px solid #1a1525;border-top:none;border-radius:0 0 8px 8px;">

          <!-- Logo / Marque -->
          <p style="margin:0 0 24px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#a87fd4;">BRICE DIGITZ</p>

          <!-- Titre -->
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#e8e0f0;line-height:1.2;">
            Paiement confirmé 🎉
          </h1>

          <p style="margin:0 0 24px;font-size:15px;color:#aaa;line-height:1.7;">
            Bonjour <strong style="color:#e8e0f0;">${customerName}</strong>,<br><br>
            Ton paiement a bien été reçu. Voici ton accès immédiat aux
            <strong style="color:#e8e0f0;">10 Prompts Master</strong>.
          </p>

          <!-- Bouton CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
            <tr>
              <td align="center" style="background:#9040c8;border-radius:4px;">
                <a href="${PDF_LINK}"
                   style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;
                          color:#ffffff;text-decoration:none;letter-spacing:0.03em;">
                  Télécharger mon PDF →
                </a>
              </td>
            </tr>
          </table>

          <!-- Lien texte de secours -->
          <p style="margin:0 0 32px;font-size:12px;color:#7a6e8a;line-height:1.6;">
            Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br>
            <a href="${PDF_LINK}" style="color:#a87fd4;word-break:break-all;">${PDF_LINK}</a>
          </p>

          <!-- Séparateur -->
          <hr style="border:none;border-top:1px solid #1a1525;margin:0 0 24px;">

          <!-- Ce qu'il y a dedans -->
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#7a6e8a;">CE QUE TU AS OBTENU</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            ${[
              ["🏗", "L'Architecte de Business"],
              ["🎓", "Le Tuteur Socratique"],
              ["✍", "Le Copywriter de Vente"],
              ["📋", "Le Planificateur de Contenu"],
              ["🔍", "Le Détective de Marché"],
              ["🤖", "L'Automatiseur de Tâches"],
              ["💬", "Le Coach de Closing"],
              ["🪞", "L'Éditeur Sans Pitié"],
              ["🎯", "Le Stratège de Lancement"],
              ["🧬", "Le Clonateur de Style"],
            ].map(([emoji, title]) => `
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#ccc;">
                <span style="margin-right:8px;">${emoji}</span>${title}
              </td>
            </tr>`).join("")}
          </table>

          <!-- Séparateur -->
          <hr style="border:none;border-top:1px solid #1a1525;margin:24px 0;">

          <p style="margin:0;font-size:13px;color:#7a6e8a;line-height:1.7;">
            Des questions ? Réponds directement à cet email.<br>
            Merci de ta confiance.<br><br>
            <strong style="color:#a87fd4;">Brice Digitz</strong><br>
            <span style="color:#555;">AI Workflow Consultant · Abomey-Calavi, Bénin</span>
          </p>

        </td>
      </tr>

      <!-- Footer email -->
      <tr>
        <td align="center" style="padding:20px 0;">
          <p style="margin:0;font-size:11px;color:#333;">
            © 2026 Brice Digitz · Tous droits réservés
          </p>
        </td>
      </tr>

    </table>
  </td>
</tr>
```

  </table>
</body>
</html>
    `,
  };

const sendResult = await httpsPost(
“api.resend.com”,
“/emails”,
{
Authorization: `Bearer ${RESEND_API_KEY}`,
“Content-Type”: “application/json”,
},
emailBody
);

if (sendResult.status !== 200 && sendResult.status !== 201) {
console.error(“Erreur Resend”, sendResult.body);
return { statusCode: 500, body: “Erreur envoi email” };
}

console.log(`Email envoyé avec succès à ${customerEmail}`);
return { statusCode: 200, body: “OK” };
};
