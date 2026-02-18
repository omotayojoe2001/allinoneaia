export const generateSalaryReceipt = async (member: any, payment: any, profile: any, paymentCalc: any, stats: any, toast: any) => {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const margin = 15;
    const currency = profile?.default_currency || "USD";
    const currencyMap: any = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", INR: "₹", CAD: "$", AUD: "$" };
    const currencySymbol = currencyMap[currency] || "$";

    if (profile?.business_logo_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = profile.business_logo_url;
        await new Promise((resolve) => { img.onload = resolve; });
        doc.addImage(img, 'PNG', margin, margin, 30, 30);
      } catch (e) { console.log('Logo failed'); }
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(38);
    doc.setFont(undefined, 'bold');
    doc.text('SALARY RECEIPT', 210 - margin, margin + 10, { align: 'right' });
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(payment.month, 210 - margin, margin + 20, { align: 'right' });

    let y = 55;
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'bold');
    doc.text('FROM:', margin, y);
    y += 6;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(profile?.business_name || '', margin, y);
    y += 6;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    if (profile?.business_address) {
      doc.text('Address: ' + profile.business_address, margin, y);
      y += 5;
    }
    if (profile?.business_phone) {
      doc.text('Phone: ' + profile.business_phone, margin, y);
    }

    y = 55;
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'bold');
    doc.text('TO:', 120, y);
    y += 6;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(member.name, 120, y);
    y += 6;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    if (member.email) {
      doc.text('Email: ' + member.email, 120, y);
      y += 5;
    }
    if (member.phone) {
      doc.text('Phone: ' + member.phone, 120, y);
      y += 5;
    }
    if (member.position) {
      doc.text('Position: ' + member.position, 120, y);
    }

    y = 105;
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(120, y, 35, 10, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('PAID', 137.5, y + 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text('Payment Date: ' + (payment.paid_date || new Date().toISOString().split('T')[0]), margin, y + 7);

    y = 125;
    const tableWidth = 210 - (margin * 2);
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, y, tableWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('PAYMENT DETAILS', margin + 5, y + 8);
    doc.setTextColor(0, 0, 0);

    y += 12;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    const totalPaid = stats.totalPaid + parseFloat(payment.amount);
    const totalSalary = parseFloat(member.salary) || 0;
    const outstanding = totalSalary - totalPaid;
    const isAdvance = totalPaid > totalSalary;
    
    const details = [
      ['Payment Cycle:', member.payment_cycle || 'monthly'],
      ['Include Weekends:', member.include_weekends ? 'Yes' : 'No'],
      ['Working Days in Cycle:', paymentCalc.workingDays.toString()],
      ['Daily Rate:', currencySymbol + ' ' + paymentCalc.dailyRate.toFixed(2)],
      ['Days Worked This Period:', stats.daysPresent.toString()],
      ['Gross Earnings:', currencySymbol + ' ' + paymentCalc.earnedAmount.toFixed(2)],
      ['Deductions (Late):', currencySymbol + ' ' + paymentCalc.deductions.toFixed(2)]
    ];

    details.forEach((detail, i) => {
      const rowHeight = 9;
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, tableWidth, rowHeight, 'F');
      }
      doc.setFont(undefined, 'normal');
      doc.text(detail[0], margin + 5, y + 6);
      doc.setFont(undefined, 'bold');
      doc.text(detail[1], 210 - margin - 5, y + 6, { align: 'right' });
      y += rowHeight;
    });

    y += 8;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('NET PAYMENT:', margin + 5, y);
    doc.text(currencySymbol + ' ' + parseFloat(payment.amount).toFixed(2), 210 - margin - 5, y, { align: 'right' });

    y += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Total Salary:', margin + 5, y);
    doc.text(currencySymbol + ' ' + totalSalary.toFixed(2), 210 - margin - 5, y, { align: 'right' });
    y += 6;
    doc.text('Total Paid (Including This):', margin + 5, y);
    doc.text(currencySymbol + ' ' + totalPaid.toFixed(2), 210 - margin - 5, y, { align: 'right' });
    y += 6;
    
    if (isAdvance) {
      doc.setTextColor(34, 197, 94);
      doc.setFont(undefined, 'bold');
      doc.text('Advance Payment:', margin + 5, y);
      doc.text(currencySymbol + ' ' + Math.abs(outstanding).toFixed(2), 210 - margin - 5, y, { align: 'right' });
    } else if (outstanding > 0) {
      doc.setTextColor(239, 68, 68);
      doc.setFont(undefined, 'bold');
      doc.text('Outstanding Balance:', margin + 5, y);
      doc.text(currencySymbol + ' ' + outstanding.toFixed(2), 210 - margin - 5, y, { align: 'right' });
    } else {
      doc.setTextColor(34, 197, 94);
      doc.setFont(undefined, 'bold');
      doc.text('Status:', margin + 5, y);
      doc.text('FULLY PAID', 210 - margin - 5, y, { align: 'right' });
    }
    doc.setTextColor(0, 0, 0);

    if (profile?.business_motto) {
      y += 15;
      doc.setFontSize(10);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text(profile.business_motto, 105, y, { align: 'center' });
    }

    doc.save(`Salary_Receipt_${member.name}_${payment.month}.pdf`);
    toast({ title: "Success", description: "Receipt downloaded" });
  } catch (error) {
    toast({ title: "jsPDF Not Installed", description: "Run: npm install jspdf", variant: "destructive" });
  }
};
