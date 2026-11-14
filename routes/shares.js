const express = require("express");
const crypto = require("crypto");
const db = require("../db");

const router = express.Router();
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function makeCode() {
    let code = "";
    for(let i = 0; i < 6; i++) {
        code+=alphabet[crypto.randomInt(alphabet.length)];
    }
}
router.post("/shares", (req, res) => {
    const { patient_id, document_ids } = req.body;
    const minutes = Number(req.body.minutes ?? 15);
    if (!patient_id || !Array.isArray(document_ids) || document_ids.length === 0) {
        return res.status(400).json({ error: "patient id and document ids are required" });
    }
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return res.status(400).json({ error: "minutes must be a positive integer" });
    }
    const docs = db.getDocuments(document_ids);
    const ok =
        docs.length === new Set(document_ids).size &&
        docs.every((d) => d.patient_id === patient_id);
    if (!ok) {
        return res.status(400).json({ error: "At least 1 of these documents aren't the patient's" });
    }
    let code = makeCode();
    while (db.getShare(code)) code = makeCode();
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    db.createShare({
        code,
        patientId: patient_id,
        documentIds: document_ids,
        expiresAt,
    });

    res.json({ code, expires_at: expiresAt, document_ids });
    module.exports = router;
});

router.get("/shares", (req, res) => {
    const code = req.params.code.toUpperCase();
    const viewerId = req.query.viewer_id;
    const share = db.getShare(code);
    if(!share) {
        return res.status().json({error: "Share code not found"});
    }
    else if(new Date(share.expiresAt()) <= new Date()) {
        return res.status().json({error: "This share has expired"});
    }
    const viewer = viewerId ? db.getUser(viewerId) : undefined;
    if(!viewer || viewer.role !== "staff") {
        return res.status(403).json({error: "Only staff members can open shares"});
    }
    let documents = db.getDocuments(share.document_ids);
    for(const doc of documents) {
        b.logAccess({shareCode: code, viewerId: viewer.id, documentId: doc.id});
    }
    res.json({
        patient: share.patient_id,
        expires_at: share.expires_at,
        documents,
    });
});
router.get("/patients/:id/access-log", (req, res) => {
    res.json(db.listAccessLog(req.params.id));
});