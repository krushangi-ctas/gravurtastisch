import { jsPDF } from 'jspdf';
import moment from 'moment';
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

export async function generateSellerInvoicePDF(user: User): Promise<void> {
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

	const planName = paidPlan?.name || 'Seller Subscription';
	const price = Number(paidPlan?.price) || 0;
	const cycleNum = Number(paidPlan?.billingCycle) || 1;
	const cycleText =
		cycleNum === 3 ? 'Annual (Billed Yearly)' : cycleNum === 2 ? 'Quarterly (Billed 3-Monthly)' : 'Monthly';
	const quota = Number(paidPlan?.request_quota) || Number(user.planLimits?.maxReviewRequestsPerMonth) || 1000;
	const marketplaces = Number(paidPlan?.marketplace) || Number(user.planLimits?.maxMarketplaces) || 1;

	const invoiceDate = paidPlan?.startsAt || paidPlan?.selectedAt || user.createdAt || new Date();
	const formattedDate = moment(invoiceDate).format('MMMM DD, YYYY');
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

	if (logoDataUrl) {
		// 420x139 aspect ratio is ~ 3.02:1
		// Width: 52mm, Height: 17.2mm
		doc.addImage(logoDataUrl, 'PNG', leftMargin, 16, 52, 17.2);

		// Tagline below logo
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8.5);
		doc.setTextColor(80, 80, 80);
		doc.text('Personalized Product Proofing & Fulfillment Platform', leftMargin, 39);
	} else {
		// Fallback to text brand title
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(22);
		doc.setTextColor(15, 23, 42); // Deep Charcoal / Black
		doc.text('GRAVURTASTISCH', leftMargin, 22);

		// Tagline
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8.5);
		doc.setTextColor(80, 80, 80);
		doc.text('Personalized Product Proofing & Fulfillment Platform', leftMargin, 28);
	}

	// Top Right - INVOICE title
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(20);
	doc.setTextColor(15, 23, 42);
	doc.text('INVOICE', rightMargin, 22, { align: 'right' });

	// Invoice metadata top-right
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(50, 50, 50);
	doc.text(`Invoice No:`, rightMargin - 35, 28, { align: 'right' });
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(15, 23, 42);
	doc.text(invoiceNumber, rightMargin, 28, { align: 'right' });

	doc.setFont('helvetica', 'bold');
	doc.setTextColor(50, 50, 50);
	doc.text(`Issue Date:`, rightMargin - 35, 33, { align: 'right' });
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(15, 23, 42);
	doc.text(formattedDate, rightMargin, 33, { align: 'right' });

	// Status badge: PAID (clean black outline box)
	doc.setDrawColor(20, 20, 20);
	doc.setLineWidth(0.4);
	doc.roundedRect(rightMargin - 28, 36.5, 28, 7, 1.5, 1.5, 'S');
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9.5);
	doc.setTextColor(20, 20, 20);
	doc.text('STATUS: PAID', rightMargin - 14, 41.5, { align: 'center' });

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
	doc.text('BILLED TO (SELLER DETAILS)', leftMargin, sectionTop);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.setTextColor(15, 23, 42);
	doc.text(user.name || 'Seller Account', leftMargin, sectionTop + 6);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.setTextColor(60, 60, 60);
	let currentY = sectionTop + 11;
	if (user.businessName && user.businessName !== user.name) {
		doc.text(`Brand / Business: ${user.businessName}`, leftMargin, currentY);
		currentY += 5;
	}
	doc.text(`Email: ${user.email}`, leftMargin, currentY);
	currentY += 5;
	if (user.contact_no) {
		doc.text(`Contact: ${user.contact_no}`, leftMargin, currentY);
		currentY += 5;
	}
	doc.text(`Account ID: ${user._id ? user._id : 'N/A'}`, leftMargin, currentY);

	// Column 2: Payment Details (at X = 118mm)
	const col2X = 118;
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(100, 100, 100);
	doc.text('PAYMENT SPECIFICATIONS', col2X, sectionTop);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(15, 23, 42);
	doc.text('Payment Gateway:', col2X, sectionTop + 6);
	doc.setFont('helvetica', 'normal');
	doc.text('Stripe Checkout (Card / Online)', col2X + 38, sectionTop + 6);

	doc.setFont('helvetica', 'bold');
	doc.text('Billing Frequency:', col2X, sectionTop + 11);
	doc.setFont('helvetica', 'normal');
	doc.text(cycleText, col2X + 38, sectionTop + 11);

	doc.setFont('helvetica', 'bold');
	doc.text('Payment Status:', col2X, sectionTop + 16);
	doc.setFont('helvetica', 'normal');
	doc.text('Completed & Verified', col2X + 38, sectionTop + 16);

	doc.setFont('helvetica', 'bold');
	doc.text('Transaction Ref:', col2X, sectionTop + 21);
	doc.setFont('helvetica', 'normal');
	const truncatedRef = paymentRef.length > 22 ? `${paymentRef.slice(0, 20)}...` : paymentRef;
	doc.text(truncatedRef, col2X + 38, sectionTop + 21);

	// Thin Divider Line
	const tableTop = Math.max(currentY + 8, sectionTop + 30);
	doc.setDrawColor(200, 200, 200);
	doc.setLineWidth(0.3);
	doc.line(leftMargin, tableTop - 3, rightMargin, tableTop - 3);

	// === 3. ITEMS TABLE (BLACK & WHITE DESIGN) ===
	const thHeight = 8.5;
	const colNoX = leftMargin + 3;
	const colPlanX = leftMargin + 16;
	const colAllowanceX = leftMargin + 75;
	const colPeriodX = leftMargin + 132;
	const colAmountX = rightMargin - 3;

	// Header bar: Solid dark background
	doc.setFillColor(25, 25, 25);
	doc.rect(leftMargin, tableTop, pageWidth, thHeight, 'F');

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8.5);
	doc.setTextColor(255, 255, 255);
	doc.text('NO.', colNoX, tableTop + 5.8);
	doc.text('SUBSCRIPTION PLAN', colPlanX, tableTop + 5.8);
	doc.text('CHANNELS & QUOTA', colAllowanceX, tableTop + 5.8);
	doc.text('BILLING PERIOD', colPeriodX, tableTop + 5.8);
	doc.text('TOTAL (USD)', colAmountX, tableTop + 5.8, { align: 'right' });

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
	doc.text(`${marketplaces} ${marketplaces === 1 ? 'Market' : 'Markets'} · ${quota.toLocaleString()} req/mo`, colAllowanceX, textY);
	doc.text(cycleText.split(' ')[0], colPeriodX, textY);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9.5);
	doc.setTextColor(15, 23, 42);
	doc.text(`$${price.toFixed(2)}`, colAmountX, textY, { align: 'right' });

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
	doc.text('Subtotal:', sumColLabel, summaryY);
	doc.setTextColor(20, 20, 20);
	doc.text(`$${price.toFixed(2)} USD`, sumColVal, summaryY, { align: 'right' });

	doc.setTextColor(80, 80, 80);
	doc.text('Tax / VAT (0%):', sumColLabel, summaryY + 5.5);
	doc.setTextColor(20, 20, 20);
	doc.text('$0.00 USD', sumColVal, summaryY + 5.5, { align: 'right' });

	// Total Box
	const totalBoxY = summaryY + 10;
	doc.setFillColor(245, 245, 245);
	doc.setDrawColor(20, 20, 20);
	doc.setLineWidth(0.4);
	doc.roundedRect(sumColLabel - 3, totalBoxY, 68, 10, 1.5, 1.5, 'FD');

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.setTextColor(15, 23, 42);
	doc.text('TOTAL PAID:', sumColLabel, totalBoxY + 6.5);
	doc.text(`$${price.toFixed(2)} USD`, sumColVal, totalBoxY + 6.5, { align: 'right' });

	// === 5. NOTES & TERMS ===
	const notesY = rowBottomY + 12;
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8.5);
	doc.setTextColor(70, 70, 70);
	doc.text('NOTES & TERMS:', leftMargin, notesY);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(100, 100, 100);
	doc.text('• This electronic receipt confirms full payment for the selected subscription period.', leftMargin, notesY + 5);
	doc.text('• Review quota and marketplace limits renew automatically per your plan schedule.', leftMargin, notesY + 9.5);
	doc.text('• For assistance, invoices or account inquiries, contact support@gravurtastisch.com.', leftMargin, notesY + 14);

	// === 6. FOOTER ===
	const footerY = 275;
	doc.setDrawColor(200, 200, 200);
	doc.setLineWidth(0.3);
	doc.line(leftMargin, footerY, rightMargin, footerY);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.5);
	doc.setTextColor(120, 120, 120);
	doc.text('Gravurtastisch Platform · Automated Billing System', leftMargin, footerY + 5);
	doc.text(`Generated on ${moment().format('DD MMM YYYY, HH:mm')}`, rightMargin, footerY + 5, { align: 'right' });

	// Trigger download
	const safeName = (user.name || 'seller').replace(/[^a-zA-Z0-9]/g, '_');
	const safePlan = planName.replace(/[^a-zA-Z0-9]/g, '_');
	doc.save(`Invoice_${safeName}_${safePlan}.pdf`);
}
