import { jsPDF } from 'jspdf';
import type { Message } from '../types';

export function exportMessageAsPdf(userQuery: string, response: string, messageId: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235); // primary-600
  doc.text('MoneyMind AI — Response Export', margin, y);
  y += 12;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
  y += 10;

  if (userQuery) {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('You:', margin, y);
    y += 6;
    doc.setFontSize(10);
    const userLines = doc.splitTextToSize(userQuery, maxWidth);
    doc.text(userLines, margin, y);
    y += userLines.length * 5 + 8;
  }

  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text('MoneyMind AI:', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const responseLines = doc.splitTextToSize(response, maxWidth);
  doc.text(responseLines, margin, y);

  doc.save(`response-${messageId}.pdf`);
}

export function exportConversationAsPdf(messages: Message[], sessionId: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text('MoneyMind AI — Conversation Export', margin, y);
  y += 12;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
  y += 10;

  for (const msg of messages) {
    const label = msg.role === 'user' ? 'You' : 'MoneyMind AI';
    const labelColor: [number, number, number] = msg.role === 'user' ? [0, 0, 0] : [37, 99, 235];

    doc.setFontSize(11);
    doc.setTextColor(...labelColor);
    doc.text(`${label}:`, margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(msg.content, maxWidth);

    if (y + lines.length * 5 > pageHeight - margin) {
      doc.addPage();
      y = 20;
    }

    doc.text(lines, margin, y);
    y += lines.length * 5 + 8;
  }

  doc.save(`conversation-${sessionId}.pdf`);
}
