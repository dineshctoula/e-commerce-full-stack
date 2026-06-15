import { jsPDF } from 'jspdf';
import type { Order } from '../store/orders';

/**
 * Generates and downloads a professional PDF invoice for the given order.
 * Calculates totals and displays customer/order metadata.
 * 
 * @param order - The order object.
 * @param userName - Optional user name.
 */
export const generateInvoicePdf = (order: Order, userName?: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Define colors
  const primaryColor = [20, 24, 33];     // #141821 (Very dark background color matching the theme)
  const accentColor = [0, 188, 212];     // #00bcd4 (Cyan accent color matching the site theme)
  const textColor = [51, 51, 51];        // #333333 (Dark gray text)
  const lightGray = [120, 120, 120];     // #787878 (Light gray text)
  const lineGray = [230, 230, 230];      // #e6e6e6 (Divider lines)

  // 1. Header Bar (Navy/Dark theme block)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 45, 'F');

  // Accent Line at the bottom of the header
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 43, 210, 2, 'F');

  // Store Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('E-COM STORE', 15, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Premium Electronics & Goods', 15, 26);
  doc.text('support@ecom.com | www.ecom.com', 15, 31);

  // Invoice Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('INVOICE', 195, 20, { align: 'right' });

  // Invoice date & short ID
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 195, 26, { align: 'right' });
  doc.text(`Invoice No: INV-${order.id.substring(0, 8).toUpperCase()}`, 195, 31, { align: 'right' });

  // Reset text color to main text color
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // 2. Billing & Order Info Metadata Section
  // Billing Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('INVOICE TO:', 15, 58);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const nameToUse = userName || order.shippingEmail.split('@')[0];
  doc.text(nameToUse, 15, 63);
  doc.text(`Email: ${order.shippingEmail}`, 15, 68);
  doc.text(`Phone: ${order.shippingPhone}`, 15, 73);
  
  // Format Address (handle wrapping for long addresses)
  const fullAddress = `${order.shippingAddress}, ${order.shippingLocalAddress}`;
  const addressLines = doc.splitTextToSize(fullAddress, 85);
  doc.text(addressLines, 15, 78);
  doc.text(`${order.shippingCity}, ${order.shippingCountry} ${order.shippingPostalCode}`, 15, 83 + (addressLines.length > 1 ? 4 : 0));

  // Order Details Column (Right Side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ORDER DETAILS:', 120, 58);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Order ID: ${order.id}`, 120, 63);
  doc.text(`Status: ${order.status}`, 120, 68);
  doc.text(`Payment Mode: ${order.status === 'PENDING' && !order.discountAmount ? 'Cash on Delivery (COD)' : 'Credit Card (Stripe)'}`, 120, 73);
  
  // 3. Line Items Table
  let currentY = 100;
  
  // Table Header Background
  doc.setFillColor(245, 246, 248);
  doc.rect(15, currentY, 180, 8, 'F');
  
  // Table Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Product Description', 18, currentY + 5.5);
  doc.text('Unit Price', 130, currentY + 5.5, { align: 'right' });
  doc.text('Qty', 155, currentY + 5.5, { align: 'center' });
  doc.text('Total', 192, currentY + 5.5, { align: 'right' });
  
  // Reset text color
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');
  
  currentY += 8;

  // Table Rows
  order.items.forEach((item) => {
    // Check page overflow
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
      // Redraw Table Header in new page
      doc.setFillColor(245, 246, 248);
      doc.rect(15, currentY, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Product Description', 18, currentY + 5.5);
      doc.text('Unit Price', 130, currentY + 5.5, { align: 'right' });
      doc.text('Qty', 155, currentY + 5.5, { align: 'center' });
      doc.text('Total', 192, currentY + 5.5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      currentY += 8;
    }

    const title = item.product?.title || 'Product Item';
    const slicedTitle = title.length > 55 ? title.substring(0, 52) + '...' : title;
    
    doc.text(slicedTitle, 18, currentY + 6);
    doc.text(`$${item.price.toFixed(2)}`, 130, currentY + 6, { align: 'right' });
    doc.text(item.quantity.toString(), 155, currentY + 6, { align: 'center' });
    
    const lineTotal = item.price * item.quantity;
    doc.text(`$${lineTotal.toFixed(2)}`, 192, currentY + 6, { align: 'right' });
    
    // Draw row bottom border
    doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
    doc.line(15, currentY + 9, 195, currentY + 9);
    
    currentY += 9;
  });

  // Calculate totals
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = order.discountAmount || 0;
  const netTotal = subtotal - discount;
  const tax = netTotal * 0.090909; // 10% tax included in the price
  const grandTotal = order.totalAmount;

  // Spacing before totals
  currentY += 5;

  // 4. Totals Block (Right Aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  doc.text('Subtotal:', 150, currentY);
  doc.text(`$${subtotal.toFixed(2)}`, 192, currentY, { align: 'right' });
  currentY += 5;

  if (discount > 0) {
    const couponLabel = order.coupon?.code ? `Discount (${order.coupon.code}):` : 'Discount:';
    doc.setTextColor(16, 185, 129); // Success green color for discount
    doc.text(couponLabel, 150, currentY);
    doc.text(`-$${discount.toFixed(2)}`, 192, currentY, { align: 'right' });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]); // reset
    currentY += 5;
  }

  doc.text('Tax (10% incl.):', 150, currentY);
  doc.text(`$${tax.toFixed(2)}`, 192, currentY, { align: 'right' });
  currentY += 5;

  // Draw border for grand total
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(140, currentY, 195, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Grand Total:', 150, currentY);
  doc.text(`$${grandTotal.toFixed(2)}`, 192, currentY, { align: 'right' });

  // 5. Professional Footer
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(15, 275, 195, 275);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Thank you for shopping with E-COM Store!', 105, 281, { align: 'center' });
  doc.text('If you have any questions about this invoice, please contact support@ecom.com', 105, 285, { align: 'center' });

  // Save the PDF
  doc.save(`invoice_${order.id}.pdf`);
};
