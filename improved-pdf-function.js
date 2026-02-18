// Improved PDF generation - paste this to replace the generatePDF function

const generatePDF = async (invoice: any) => {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const themeColor = getThemeColor();

    // Logo
    if (profile?.business_logo_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = profile.business_logo_url;
        await new Promise((resolve) => { img.onload = resolve; });
        doc.addImage(img, 'PNG', 15, 10, 35, 35);
      } catch (e) {
        console.log('Logo failed');
      }
    }

    // Header
    doc.setFillColor(themeColor);
    doc.rect(0, 0, 210, 55, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(38);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', 110, 28);
    doc.setFontSize(12);
    doc.text(invoice.invoice_number, 110, 40);
    doc.setTextColor(0, 0, 0);

    // FROM
    let y = 65;
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'bold');
    doc.text('FROM:', 20, y);
    y += 7;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(profile?.business_name || '', 20, y);
    y += 6;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Address: ' + (profile?.business_address || ''), 20, y);
    y += 5;
    doc.text('Phone: ' + (profile?.business_phone || ''), 20, y);
    if (profile?.business_whatsapp) {
      y += 5;
      doc.text('WhatsApp: ' + profile.business_whatsapp, 20, y);
    }
    if (profile?.business_motto) {
      y += 5;
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(profile.business_motto, 20, y);
    }

    // TO
    y = 65;
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'bold');
    doc.text('TO:', 120, y);
    y += 7;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.customers?.name || 'N/A', 120, y);
    y += 6;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    if (invoice.customers?.email) {
      doc.text('Email: ' + invoice.customers.email, 120, y);
      y += 5;
    }
    if (invoice.customers?.address) {
      doc.text('Address: ' + invoice.customers.address, 120, y);
    }

    // Status
    y = 100;
    const statusColors = { paid: '#10B981', overdue: '#EF4444', due: '#F59E0B' };
    doc.setFillColor(statusColors[invoice.status]);
    doc.roundedRect(120, y, 40, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(invoice.status.toUpperCase(), 140, y + 8, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Dates
    y = 120;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Date: ' + new Date(invoice.created_at).toLocaleDateString(), 20, y);
    doc.text('Due: ' + (invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'), 120, y);

    // Table
    y = 135;
    doc.setFillColor(themeColor);
    doc.rect(15, y, 180, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIPTION', 20, y + 8);
    doc.text('QTY', 125, y + 8);
    doc.text('RATE', 145, y + 8);
    doc.text('AMOUNT', 175, y + 8);
    doc.setTextColor(0, 0, 0);

    y += 14;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    const items = JSON.parse(invoice.items || '[]');
    items.forEach((item: any, i: number) => {
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, y - 4, 180, 10, 'F');
      }
      doc.text(item.description, 20, y);
      doc.text(item.quantity.toString(), 128, y);
      doc.text(invoice.currency + ' ' + parseFloat(item.rate).toFixed(2), 148, y);
      doc.text(invoice.currency + ' ' + (item.quantity * item.rate).toFixed(2), 178, y);
      y += 10;
    });

    // Totals
    y += 8;
    doc.line(120, y, 195, y);
    y += 8;
    doc.setFontSize(11);
    doc.text('Subtotal:', 130, y);
    doc.text(invoice.currency + ' ' + parseFloat(invoice.subtotal).toFixed(2), 178, y);
    y += 6;
    doc.text('Tax:', 130, y);
    doc.text(invoice.currency + ' ' + parseFloat(invoice.tax).toFixed(2), 178, y);
    y += 6;
    doc.text('Delivery:', 130, y);
    doc.text(invoice.currency + ' ' + parseFloat(invoice.delivery_fee).toFixed(2), 178, y);
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('TOTAL:', 130, y);
    doc.text(invoice.currency + ' ' + parseFloat(invoice.amount).toFixed(2), 178, y);

    // Notes
    if (invoice.notes) {
      y += 12;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('Notes:', 20, y);
      y += 5;
      doc.setFont(undefined, 'normal');
      const notes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(notes, 20, y);
    }

    return doc;
  } catch (error) {
    toast({ title: "jsPDF Not Installed", description: "Run: npm install jspdf", variant: "destructive" });
    return null;
  }
};
