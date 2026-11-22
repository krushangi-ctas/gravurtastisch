import { jsPDF } from 'jspdf';
import moment from 'moment';
import i18n from '@/i18n/config';
import { User } from '../api/services/usersApiService';

function loadLogoImage(): Promise<string | null> {
	return new Promise((resolve) => {
		if (typeof window === 'undefined') {
			resolve(null);
			return;
		}

		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = img.naturalWidth || img.width || 420;
				canvas.height = img.naturalHeight || img.height || 139;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(img, 0, 0);
					resolve(canvas.toDataURL('image/png'));
					return;
				}
			} catch {
				// Canvas tainted or context unavailable
			}
			resolve(null);
		};

		img.onerror = () => {
			resolve(null);
		};

		img.src = '/gravurtastich.png';
	});
}

export async function generateSellerInvoicePDF(user: User, lang?: string): Promise<void> {
	const resolvedLang =
		lang ||
		i18n.language ||
		(typeof window !== 'undefined'
			? localStorage.getItem('panel_lng') || localStorage.getItem('i18nextLng')
			: null) ||
		'de';
	const isDe = resolvedLang.toLowerCase().startsWith('de');

	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4'
	});

	// Find the paid plan or active plan details
	const paidPlan =
		(Array.isArray(user.plans) &&
			(user.plans.find((p: any) => p.paymentStatus === 1 || p.status === 1) || user.plans[0])) ||
		(typeof user.currentPlanId === 'object' && user.currentPlanId ? user.currentPlanId : null);

	const planName = paidPlan?.name || (isDe ? 'Verkäufer-Abonnement' : 'Seller Subscription');
	const price = Number(paidPlan?.price) || 0;
	const cycleNum = Number(paidPlan?.billingCycle) || 1;
	const cycleText = isDe
		? cycleNum === 3
			? 'Jährlich (Jährliche Abrechnung)'
			: cycleNum === 2
			? 'Vierteljährlich (Alle 3 Monate)'
			: 'Monatlich'
		: cycleNum === 3
		? 'Annual (Billed Yearly)'
		: cycleNum === 2
		? 'Quarterly (Billed 3-Monthly)'
		: 'Monthly';
	const quota = Number(paidPlan?.request_quota) || Number(user.planLimits?.maxReviewRequestsPerMonth) || 1000;
	const marketplaces = Number(paidPlan?.marketplace) || Number(user.planLimits?.maxMarketplaces) || 1;

	const invoiceDate = paidPlan?.startsAt || paidPlan?.selectedAt || user.createdAt || new Date();
	const formattedDate = isDe ? moment(invoiceDate).format('DD.MM.YYYY') : moment(invoiceDate).format('MMMM DD, YYYY');
	const invoiceNumber = `INV-${moment(invoiceDate).format('YYYYMMDD')}-${user._id ? user._id.slice(-6).toUpperCase() : '000000'}`;
	const paymentRef =
		paidPlan?.stripePaymentIntentId ||
		paidPlan?.stripeSessionId ||
		user.stripeSubscriptionId ||
		'STRIPE-PAID-TXN';

	// Page width: 210mm, Margins: 16mm
	const leftMargin = 16;
	const rightMargin = 194;
	const pageWidth = rightMargin - leftMargin;

	// === 1. TOP HEADER ===
	const logoDataUrl = await loadLogoImage();
	const taglineText = isDe
		? 'Personalisierte Produktprüfungs- und Fulfillment-Plattform'
		: 'Personalized Product Proofing & Fulfillment Platform';

	if (logoDataUrl) {
		// 420x139 aspect ratio is ~ 3.02:1
		// Width: 52mm, Height: 17.2mm
		doc.addImage(logoDataUrl, 'PNG', leftMargin, 16, 52, 17.2);

		// Tagline below logo
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8.5);
		doc.setTextColor(80, 80, 80);
		doc.text(taglineText, leftMargin, 39);
	} else {
		// Fallback to text brand title
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(22);
		doc.setTextColor(15, 23, 42); // Deep Charcoal / Black
		doc.text('PRINTOMATION', leftMargin, 22);

		// Tagline
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8.5);
		doc.setTextColor(80, 80, 80);
		doc.text(taglineText, leftMargin, 28);
	}

	// Top Right - INVOICE title
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(20);
	doc.setTextColor(15, 23, 42);
	doc.text(isDe ? 'RECHNUNG' : 'INVOICE', rightMargin, 22, { align: 'right' });

	// Invoice metadata top-right
	const metaLabelX = rightMargin - (isDe ? 38 : 35);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(50, 50, 50);
	doc.text(isDe ? 'Rechnungsnr.:' : 'Invoice No:', metaLabelX, 28, { align: 'right' });
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(15, 23, 42);
	doc.text(invoiceNumber, rightMargin, 28, { align: 'right' });

	doc.setFont('helvetica', 'bold');
	doc.setTextColor(50, 50, 50);
	doc.text(isDe ? 'Ausstellungsdatum:' : 'Issue Date:', metaLabelX, 33, { align: 'right' });
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(15, 23, 42);
	doc.text(formattedDate, rightMargin, 33, { align: 'right' });

	// Status badge: PAID (clean black outline box)
	const badgeWidth = isDe ? 35 : 28;
	doc.setDrawColor(20, 20, 20);
	doc.setLineWidth(0.4);
	doc.roundedRect(rightMargin - badgeWidth, 36.5, badgeWidth, 7, 1.5, 1.5, 'S');
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9.5);
	doc.setTextColor(20, 20, 20);
	doc.text(isDe ? 'STATUS: BEZAHLT' : 'STATUS: PAID', rightMargin - (badgeWidth / 2), 41.5, { align: 'center' });

	// Main Divider Line
	doc.setDrawColor(30, 30, 30);
	doc.setLineWidth(0.8);
	doc.line(leftMargin, 47, rightMargin, 47);

	// === 2. BILLED TO & PAYMENT INFO SECTION ===
	const sectionTop = 55;

	// Column 1: Billed To
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(100, 100, 100);
	doc.text(isDe ? 'RECHNUNGSEMPFÄNGER (VERKÄUFER)' : 'BILLED TO (SELLER DETAILS)', leftMargin, sectionTop);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.setTextColor(15, 23, 42);
	doc.text(user.name || (isDe ? 'Verkäuferkonto' : 'Seller Account'), leftMargin, sectionTop + 6);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.setTextColor(60, 60, 60);
	let currentY = sectionTop + 11;
	if (user.businessName && user.businessName !== user.name) {
		doc.text(`${isDe ? 'Marke / Unternehmen:' : 'Brand / Business:'} ${user.businessName}`, leftMargin, currentY);
		currentY += 5;
	}
	doc.text(`${isDe ? 'E-Mail:' : 'Email:'} ${user.email}`, leftMargin, currentY);
	currentY += 5;
	if (user.contact_no) {
		doc.text(`${isDe ? 'Kontakt:' : 'Contact:'} ${user.contact_no}`, leftMargin, currentY);
		currentY += 5;
	}
	doc.text(`${isDe ? 'Konto-ID:' : 'Account ID:'} ${user._id ? user._id : 'N/A'}`, leftMargin, currentY);

	// Column 2: Payment Details (at X = 114mm)
	const col2X = 114;
	const col2ValX = col2X + 40;
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(100, 100, 100);
	doc.text(isDe ? 'ZAHLUNGSDETAILS' : 'PAYMENT SPECIFICATIONS', col2X, sectionTop);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(15, 23, 42);
	doc.text(isDe ? 'Zahlungsmethode:' : 'Payment Gateway:', col2X, sectionTop + 6);
	doc.setFont('helvetica', 'normal');
	doc.text(isDe ? 'Stripe Checkout (Karte / Online)' : 'Stripe Checkout (Card / Online)', col2ValX, sectionTop + 6);

	doc.setFont('helvetica', 'bold');
	doc.text(isDe ? 'Abrechnungsintervall:' : 'Billing Frequency:', col2X, sectionTop + 11);
	doc.setFont('helvetica', 'normal');
	doc.text(cycleText, col2ValX, sectionTop + 11);

	doc.setFont('helvetica', 'bold');
	doc.text(isDe ? 'Zahlungsstatus:' : 'Payment Status:', col2X, sectionTop + 16);
	doc.setFont('helvetica', 'normal');
	doc.text(isDe ? 'Abgeschlossen & Verifiziert' : 'Completed & Verified', col2ValX, sectionTop + 16);

	doc.setFont('helvetica', 'bold');
	doc.text(isDe ? 'Transaktions-Ref.:' : 'Transaction Ref:', col2X, sectionTop + 21);
	doc.setFont('helvetica', 'normal');
	const truncatedRef = paymentRef.length > 22 ? `${paymentRef.slice(0, 20)}...` : paymentRef;
	doc.text(truncatedRef, col2ValX, sectionTop + 21);

	// Thin Divider Line
	const tableTop = Math.max(currentY + 8, sectionTop + 30);
	doc.setDrawColor(200, 200, 200);
	doc.setLineWidth(0.3);
	doc.line(leftMargin, tableTop - 3, rightMargin, tableTop - 3);

	// === 3. ITEMS TABLE (BLACK & WHITE DESIGN) ===
	const thHeight = 8.5;
	const colNoX = leftMargin + 3;
	const colPlanX = leftMargin + 14;
	const colAllowanceX = leftMargin + 64;
	const colPeriodX = leftMargin + 120;
	const colAmountX = rightMargin - 3;

	// Header bar: Solid dark background
	doc.setFillColor(25, 25, 25);
	doc.rect(leftMargin, tableTop, pageWidth, thHeight, 'F');

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8);
	doc.setTextColor(255, 255, 255);
	doc.text(isDe ? 'NR.' : 'NO.', colNoX, tableTop + 5.6);
	doc.text(isDe ? 'ABONNEMENTPLAN' : 'SUBSCRIPTION PLAN', colPlanX, tableTop + 5.6);
	doc.text(isDe ? 'KANÄLE & KONTINGENT' : 'CHANNELS & QUOTA', colAllowanceX, tableTop + 5.6);
	doc.text(isDe ? 'ZEITRAUM' : 'BILLING PERIOD', colPeriodX, tableTop + 5.6);
	doc.text(isDe ? 'GESAMT (EUR)' : 'TOTAL (EUR)', colAmountX, tableTop + 5.6, { align: 'right' });

	// Item Row
	const rowHeight = 10;
	const rowY = tableTop + thHeight;
	const textY = rowY + 6.5;

	// Light background fill for row
	doc.setFillColor(250, 250, 250);
	doc.rect(leftMargin, rowY, pageWidth, rowHeight, 'F');

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(20, 20, 20);
	doc.text('01', colNoX, textY);
	doc.text(planName, colPlanX, textY);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	doc.setTextColor(40, 40, 40);
	const marketplacesLabel = marketplaces === 1 ? (isDe ? 'Marktplatz' : 'Market') : (isDe ? 'Marktplätze' : 'Markets');
	const quotaLabel = isDe ? `${quota.toLocaleString('de-DE')} Anfr./Mo.` : `${quota.toLocaleString()} req/mo`;
	doc.text(`${marketplaces} ${marketplacesLabel} - ${quotaLabel}`, colAllowanceX, textY);

	const cycleShort = isDe
		? cycleNum === 3
			? 'Jährlich'
			: cycleNum === 2
			? 'Vierteljährlich'
			: 'Monatlich'
		: cycleText.split(' ')[0];
	doc.text(cycleShort, colPeriodX, textY);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9.5);
	doc.setTextColor(15, 23, 42);
	const formattedPrice = isDe ? `€ ${price.toFixed(2).replace('.', ',')}` : `€${price.toFixed(2)}`;
	doc.text(formattedPrice, colAmountX, textY, { align: 'right' });

	// Row bottom line
	const rowBottomY = rowY + rowHeight;
	doc.setDrawColor(200, 200, 200);
	doc.setLineWidth(0.4);
	doc.line(leftMargin, rowBottomY, rightMargin, rowBottomY);

	// === 4. SUMMARY / TOTALS SECTION ===
	const summaryY = rowBottomY + 8;
	const sumColLabel = rightMargin - 65;
	const sumColVal = rightMargin - 3;

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.setTextColor(80, 80, 80);
	doc.text(isDe ? 'Zwischensumme:' : 'Subtotal:', sumColLabel, summaryY);
	doc.setTextColor(20, 20, 20);
	doc.text(`${formattedPrice} EUR`, sumColVal, summaryY, { align: 'right' });

	doc.setTextColor(80, 80, 80);
	doc.text(isDe ? 'MwSt. (0%):' : 'Tax / VAT (0%):', sumColLabel, summaryY + 5.5);
	doc.setTextColor(20, 20, 20);
	doc.text(isDe ? '€ 0,00 EUR' : '€0.00 EUR', sumColVal, summaryY + 5.5, { align: 'right' });

	// Total Box
	const totalBoxY = summaryY + 10;
	doc.setFillColor(245, 245, 245);
	doc.setDrawColor(20, 20, 20);
	doc.setLineWidth(0.4);
	doc.roundedRect(sumColLabel - 3, totalBoxY, 68, 10, 1.5, 1.5, 'FD');

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.setTextColor(15, 23, 42);
	doc.text(isDe ? 'GESAMT BEZAHLT:' : 'TOTAL PAID:', sumColLabel, totalBoxY + 6.5);
	doc.text(`${formattedPrice} EUR`, sumColVal, totalBoxY + 6.5, { align: 'right' });

	// === 5. NOTES & TERMS ===
	const notesY = rowBottomY + 8;
	const maxNotesWidth = sumColLabel - leftMargin - 10; // 129 - 16 - 10 = 103mm

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8.5);
	doc.setTextColor(70, 70, 70);
	doc.text(isDe ? 'HINWEISE & BEDINGUNGEN:' : 'NOTES & TERMS:', leftMargin, notesY);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.8);
	doc.setTextColor(100, 100, 100);

	const noteItems = [
		isDe
			? '- Dieser elektronische Beleg bestätigt die vollständige Zahlung für den ausgewählten Abonnementzeitraum.'
			: '- This electronic receipt confirms full payment for the selected subscription period.',
		isDe
			? '- Das Bewertungskontingent und die Marktplatzlimits verlängern sich automatisch gemäß Ihrem Plan.'
			: '- Review quota and marketplace limits renew automatically per your plan schedule.',
		isDe
			? '- Bei Fragen, Rechnungs- oder Kontonanliegen wenden Sie sich bitte an support@printomation.com.'
			: '- For assistance, invoices or account inquiries, contact support@printomation.com.'
	];

	let currentNoteY = notesY + 4.8;
	for (const note of noteItems) {
		const lines = doc.splitTextToSize(note, maxNotesWidth);
		doc.text(lines, leftMargin, currentNoteY);
		currentNoteY += lines.length * 3.8 + 1.8;
	}

	// === 6. FOOTER ===
	const footerY = 275;
	doc.setDrawColor(200, 200, 200);
	doc.setLineWidth(0.3);
	doc.line(leftMargin, footerY, rightMargin, footerY);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.5);
	doc.setTextColor(120, 120, 120);
	doc.text(
		isDe ? 'Printomation-Plattform - Automatisiertes Abrechnungssystem' : 'Printomation Platform - Automated Billing System',
		leftMargin,
		footerY + 5
	);
	doc.text(
		isDe ? `Erstellt am ${moment().format('DD.MM.YYYY, HH:mm')}` : `Generated on ${moment().format('DD MMM YYYY, HH:mm')}`,
		rightMargin,
		footerY + 5,
		{ align: 'right' }
	);

	// Trigger download
	const safeName = (user.name || 'seller').replace(/[^a-zA-Z0-9]/g, '_');
	const safePlan = planName.replace(/[^a-zA-Z0-9]/g, '_');
	doc.save(`${isDe ? 'Rechnung' : 'Invoice'}_${safeName}_${safePlan}.pdf`);
}
