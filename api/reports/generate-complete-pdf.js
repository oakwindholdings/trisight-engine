// api/reports/generate-complete-pdf.js
const { jsPDF } = require('jspdf');

module.exports = async function handler(req, res) {
  try {
    // CORS (adjust origin if needed)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
      return res.status(405).json({ success:false, code:'PDF-METHOD', message:'Use POST' });
    }

    // Normalize body ONCE
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const rd = body.reportData || null;
    if (!rd) {
      return res.status(200).json({ success:false, code:'PDF-NODATA', message:'reportData missing' });
    }

    // Ticker derivation (one pass)
    const finalTicker = String(
      body.ticker || rd.ticker || (rd.metadata && rd.metadata.ticker) || ''
    ).toUpperCase().trim();

    if (!finalTicker) {
      return res.status(200).json({ success:false, code:'PDF-NOTICKER', message:'Report data with ticker is required' });
    }

    // Enrich reportData in-place for consistency
    rd.ticker = finalTicker;
    rd.metadata = { ...(rd.metadata || {}), ticker: finalTicker };

    // Build a tiny valid PDF in memory (no FS)
    let doc;
    try {
      doc = new jsPDF({ unit: 'mm', format: 'a4', compress: false });
      const today = new Date().toISOString().slice(0,10);

      // Cover
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
      doc.text(`TriSight Research — ${finalTicker}`, 20, 30);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
      doc.text(`Date: ${today}`, 20, 40);
      doc.text(`Timeframe: ${rd?.metadata?.timeframe || 'daily'}`, 20, 47);

      // Exec summary (basic; richer summary can be swapped later)
      doc.addPage();
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
      doc.text('Executive Summary', 20, 20);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      const text = (rd?.aiAnalysis?.executiveSummary) ||
                   (rd?.aiAnalysis?.keyInsights) ||
                   'This is a minimal stability PDF. The full fidelity layout will be reintroduced incrementally once the route is stable.';
      doc.text(doc.splitTextToSize(text, 170), 20, 30);
      // Render dynamic section outputs if present
      const secs = Array.isArray(rd?.sectionOutputs) ? rd.sectionOutputs : [];
      for (const s of secs) {
        if (!s || !s.sectionKey) continue;
        doc.addPage();
        const title = s.sectionKey.replace(/_/g,' ').replace(/\b\w/g, (m) => m.toUpperCase());
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(title, 20, 20);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(11);

        if (s.format === 'markdown') {
          const text = String(s.content || '');
          doc.text(doc.splitTextToSize(text, 170), 20, 30);
        } else if (s.format === 'bullets') {
          const bullets = Array.isArray(s.content) ? s.content : [];
          let y = 30;
          for (const b of bullets.slice(0, 24)) {
            doc.text(`• ${String(b)}`, 20, y);
            y += 7;
            if (y > 270) { doc.addPage(); y = 30; }
          }
        } else { // json
          const summary = (s.content && s.content.summary) ? String(s.content.summary) : JSON.stringify(s.content || {});
          doc.text(doc.splitTextToSize(summary, 170), 20, 30);
        }
      }


      // Footer pass (simple)
      const total = doc.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`TriSight Research • ${today} • Page ${i} / ${total}`, 20, 290);
      }

      // Stream as attachment
      const fname = `${finalTicker}_TriSight_Research_${today}.pdf`;
      const buf = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      return res.status(200).send(buf);
    } catch (e) {
      console.error('[CompletePDF/error]', { code: 'PDF-BUILD', message: String(e?.message || e) });
      return res.status(200).json({ success:false, code:'PDF-BUILD', message:'Failed to assemble PDF' });
    }
  } catch (e) {
    console.error('[CompletePDF/error]', { code: 'PDF-HANDLER', message: String(e?.message || e) });
    return res.status(200).json({ success:false, code:'PDF-HANDLER', message:'Handler error' });
  }
};

