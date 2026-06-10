// Plain-text + HTML email templates using tagged template literals.
// No external template engine needed — zero dependencies, easy to read.

// Escape user/operator-controlled values before interpolating into HTML.
// fullName, companyName, route names etc. are user input — without this an
// attacker could inject markup into the email body (HTML injection / phishing).
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface BookingConfirmedData {
  passengerName: string;
  from: string;
  to: string;
  departureTime: string;  // pre-formatted: "Sunday, 20 July 2026 at 7:00 AM"
  seatCount: number;      // open seating — number of seats, not labels
  operator: string;
  vehicleType: string;
  totalAmount: number;    // naira
  paymentRef: string;
  ticketUrl: string;
}

export function bookingConfirmedEmail(data: BookingConfirmedData): {
  subject: string;
  text: string;
  html: string;
} {
  const { passengerName, from, to, departureTime, seatCount, operator, vehicleType, totalAmount, paymentRef, ticketUrl } = data;
  // Open seating: operators assign seats at boarding, so the ticket shows a count.
  const seatList = `${seatCount} seat${seatCount !== 1 ? "s" : ""} (open seating)`;
  const amount = `₦${totalAmount.toLocaleString("en-NG")}`;

  // HTML-escaped copies for the markup body (plain-text body uses raw values).
  const h = {
    passengerName: escapeHtml(passengerName),
    from:          escapeHtml(from),
    to:            escapeHtml(to),
    departureTime: escapeHtml(departureTime),
    operator:      escapeHtml(operator),
    vehicleType:   escapeHtml(vehicleType),
    seatList:      escapeHtml(seatList),
    paymentRef:    escapeHtml(paymentRef),
  };

  const subject = `Your TransHub ticket is confirmed — ${from} → ${to}`;

  const text = `Hi ${passengerName},

Your booking is confirmed. Have a safe trip!

TRIP DETAILS
------------
Route:       ${from} → ${to}
Date & Time: ${departureTime}
Operator:    ${operator}
Vehicle:     ${vehicleType}
Seats:       ${seatList}
Amount Paid: ${amount}
Ref:         ${paymentRef}

View your ticket: ${ticketUrl}

This ticket is your boarding pass. Please show it to the conductor.

© 2026 TransHub Technologies Ltd.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#16a34a;padding:28px 32px">
            <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff">TransHub</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">Hi ${h.passengerName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151">Your booking is confirmed. Have a safe trip!</p>

            <!-- Trip details table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px">
              <tr style="background:#f9fafb">
                <td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;width:38%">Route</td>
                <td style="padding:10px 16px;font-size:14px;color:#111827">${h.from} → ${h.to}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Date &amp; Time</td>
                <td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.departureTime}</td>
              </tr>
              <tr style="background:#f9fafb">
                <td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Operator</td>
                <td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.operator}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Vehicle</td>
                <td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.vehicleType}</td>
              </tr>
              <tr style="background:#f9fafb">
                <td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Seats</td>
                <td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.seatList}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Amount Paid</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:bold;color:#16a34a;border-top:1px solid #e5e7eb">${amount}</td>
              </tr>
              <tr style="background:#f9fafb">
                <td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Ref</td>
                <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-family:monospace;border-top:1px solid #e5e7eb">${h.paymentRef}</td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="border-radius:6px;background:#16a34a">
                  <a href="${ticketUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none">View Your Ticket</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#6b7280">This ticket is your boarding pass. Please show it to the conductor.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TransHub Technologies Ltd.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Charter emails
// ---------------------------------------------------------------------------

export interface CharterRequestedData {
  passengerName:  string;
  fromLocation:   string;
  toLocation:     string;
  departureAt:    string; // pre-formatted
  vehicleType:    string;
  adminUrl:       string;
}

export function charterRequestedEmail(data: CharterRequestedData): {
  subject: string; text: string; html: string;
} {
  const h = {
    passengerName: escapeHtml(data.passengerName),
    fromLocation:  escapeHtml(data.fromLocation),
    toLocation:    escapeHtml(data.toLocation),
    departureAt:   escapeHtml(data.departureAt),
    vehicleType:   escapeHtml(data.vehicleType),
  };
  const subject = `New charter request: ${data.fromLocation} → ${data.toLocation}`;
  const text = `A new charter request has been submitted.

Passenger:   ${data.passengerName}
Route:       ${data.fromLocation} → ${data.toLocation}
Departure:   ${data.departureAt}
Vehicle:     ${data.vehicleType}

Review and quote: ${data.adminUrl}`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
        <tr><td style="background:#92400E;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#fff">TransHub Admin</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#111827">New Charter Request</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px">
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;width:38%">Passenger</td><td style="padding:10px 16px;font-size:14px;color:#111827">${h.passengerName}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Route</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.fromLocation} → ${h.toLocation}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Departure</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.departureAt}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Vehicle</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.vehicleType}</td></tr>
          </table>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background:#92400E">
            <a href="${data.adminUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#fff;text-decoration:none">Review &amp; Quote</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TransHub Technologies Ltd.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

export interface CharterQuotedData {
  passengerName: string;
  fromLocation:  string;
  toLocation:    string;
  departureAt:   string;
  quotedPrice:   number; // naira
  payUrl:        string;
}

export function charterQuotedEmail(data: CharterQuotedData): {
  subject: string; text: string; html: string;
} {
  const amount = `₦${data.quotedPrice.toLocaleString("en-NG")}`;
  const h = {
    passengerName: escapeHtml(data.passengerName),
    fromLocation:  escapeHtml(data.fromLocation),
    toLocation:    escapeHtml(data.toLocation),
    departureAt:   escapeHtml(data.departureAt),
    amount:        escapeHtml(amount),
  };
  const subject = `Your charter quote is ready — ${data.fromLocation} → ${data.toLocation}`;
  const text = `Hi ${data.passengerName},

Your charter request has been reviewed and quoted.

Route:       ${data.fromLocation} → ${data.toLocation}
Departure:   ${data.departureAt}
Quoted Price: ${amount}

To confirm your charter, please complete payment: ${data.payUrl}

This quote is valid for 48 hours.

© 2026 TransHub Technologies Ltd.`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
        <tr><td style="background:#D97706;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#fff">TransHub</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">Hi ${h.passengerName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151">Your charter has been reviewed and quoted. Complete payment below to confirm.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px">
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;width:38%">Route</td><td style="padding:10px 16px;font-size:14px;color:#111827">${h.fromLocation} → ${h.toLocation}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Departure</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.departureAt}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Quoted Price</td><td style="padding:10px 16px;font-size:14px;font-weight:bold;color:#D97706;border-top:1px solid #e5e7eb">${h.amount}</td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:16px"><tr><td style="border-radius:6px;background:#D97706">
            <a href="${data.payUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#fff;text-decoration:none">Pay Now</a>
          </td></tr></table>
          <p style="margin:0;font-size:13px;color:#6b7280">This quote is valid for 48 hours.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TransHub Technologies Ltd.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

export interface CharterConfirmedData {
  passengerName: string;
  fromLocation:  string;
  toLocation:    string;
  departureAt:   string;
  vehicleType:   string;
  quotedPrice:   number; // naira
  myChartersUrl: string;
}

export interface CharterBookingConfirmedData {
  passengerName:    string;
  fromLocation:     string;
  toLocation:       string;
  departureAt:      string;
  assignedOperator: string;
  pickupInfo:       string;
  travelInfo:       string;
  myChartersUrl:    string;
}

export interface CharterCompletedData {
  passengerName: string;
  fromLocation:  string;
  toLocation:    string;
  departureAt:   string;
  myChartersUrl: string;
}

export function charterConfirmedEmail(data: CharterConfirmedData): {
  subject: string; text: string; html: string;
} {
  const amount = `₦${data.quotedPrice.toLocaleString("en-NG")}`;
  const h = {
    passengerName: escapeHtml(data.passengerName),
    fromLocation:  escapeHtml(data.fromLocation),
    toLocation:    escapeHtml(data.toLocation),
    departureAt:   escapeHtml(data.departureAt),
    vehicleType:   escapeHtml(data.vehicleType),
    amount:        escapeHtml(amount),
  };
  const subject = `Charter confirmed! ${data.fromLocation} → ${data.toLocation}`;
  const text = `Hi ${data.passengerName},

Your charter is confirmed and payment received.

Route:        ${data.fromLocation} → ${data.toLocation}
Departure:    ${data.departureAt}
Vehicle:      ${data.vehicleType}
Amount Paid:  ${amount}

Our team will be in touch with final logistics. View your charter: ${data.myChartersUrl}

© 2026 TransHub Technologies Ltd.`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
        <tr><td style="background:#16a34a;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#fff">TransHub</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">Hi ${h.passengerName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151">Your charter is <strong>confirmed</strong>! Our team will contact you with final logistics.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px">
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;width:38%">Route</td><td style="padding:10px 16px;font-size:14px;color:#111827">${h.fromLocation} → ${h.toLocation}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Departure</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.departureAt}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Vehicle</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.vehicleType}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Amount Paid</td><td style="padding:10px 16px;font-size:14px;font-weight:bold;color:#16a34a;border-top:1px solid #e5e7eb">${h.amount}</td></tr>
          </table>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background:#16a34a">
            <a href="${data.myChartersUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#fff;text-decoration:none">View My Charters</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TransHub Technologies Ltd.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

export function charterBookingConfirmedEmail(data: CharterBookingConfirmedData): {
  subject: string; text: string; html: string;
} {
  const h = {
    passengerName:    escapeHtml(data.passengerName),
    fromLocation:     escapeHtml(data.fromLocation),
    toLocation:       escapeHtml(data.toLocation),
    departureAt:      escapeHtml(data.departureAt),
    assignedOperator: escapeHtml(data.assignedOperator),
    pickupInfo:       escapeHtml(data.pickupInfo),
    travelInfo:       escapeHtml(data.travelInfo),
  };
  const subject = `Charter booking details ready — ${data.fromLocation} → ${data.toLocation}`;
  const text = `Hi ${data.passengerName},

Your charter booking details have been confirmed. Here is everything you need for your trip.

Route:       ${data.fromLocation} → ${data.toLocation}
Departure:   ${data.departureAt}
Operator:    ${data.assignedOperator}
Pickup:      ${data.pickupInfo}
Travel Info: ${data.travelInfo}

View your booking: ${data.myChartersUrl}

© 2026 TransHub Technologies Ltd.`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
        <tr><td style="background:#16a34a;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#fff">TransHub</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">Hi ${h.passengerName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151">Your charter booking details are confirmed. Safe travels!</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px">
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;width:38%">Route</td><td style="padding:10px 16px;font-size:14px;color:#111827">${h.fromLocation} → ${h.toLocation}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Departure</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.departureAt}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Operator</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.assignedOperator}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Pickup</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.pickupInfo}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Travel Info</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.travelInfo}</td></tr>
          </table>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background:#16a34a">
            <a href="${data.myChartersUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#fff;text-decoration:none">View My Booking</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TransHub Technologies Ltd.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

export function charterCompletedEmail(data: CharterCompletedData): {
  subject: string; text: string; html: string;
} {
  const h = {
    passengerName: escapeHtml(data.passengerName),
    fromLocation:  escapeHtml(data.fromLocation),
    toLocation:    escapeHtml(data.toLocation),
    departureAt:   escapeHtml(data.departureAt),
  };
  const subject = `Charter completed — ${data.fromLocation} → ${data.toLocation}`;
  const text = `Hi ${data.passengerName},

Your charter journey has been marked as completed. We hope you had a great trip!

Route:     ${data.fromLocation} → ${data.toLocation}
Departure: ${data.departureAt}

View booking history: ${data.myChartersUrl}

Thank you for choosing TransHub.

© 2026 TransHub Technologies Ltd.`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
        <tr><td style="background:#16a34a;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#fff">TransHub</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">Hi ${h.passengerName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151">Your charter journey is complete. We hope you had a wonderful trip!</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px">
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;width:38%">Route</td><td style="padding:10px 16px;font-size:14px;color:#111827">${h.fromLocation} → ${h.toLocation}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Departure</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.departureAt}</td></tr>
          </table>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background:#16a34a">
            <a href="${data.myChartersUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#fff;text-decoration:none">View Booking History</a>
          </td></tr></table>
          <p style="margin:16px 0 0;font-size:13px;color:#6b7280">Thank you for choosing TransHub.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TransHub Technologies Ltd.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Waybill emails
// ---------------------------------------------------------------------------

export interface WaybillQuoteSentData {
  senderName:   string;
  waybillNo:    string;
  fromLocation: string;
  toLocation:   string;
  quoteAmount:  number; // naira
  payUrl:       string;
}

export function waybillQuoteSentEmail(data: WaybillQuoteSentData): {
  subject: string; text: string; html: string;
} {
  const amount = `₦${data.quoteAmount.toLocaleString("en-NG")}`;
  const h = {
    senderName:   escapeHtml(data.senderName),
    waybillNo:    escapeHtml(data.waybillNo),
    fromLocation: escapeHtml(data.fromLocation),
    toLocation:   escapeHtml(data.toLocation),
    amount:       escapeHtml(amount),
  };
  const subject = `Your shipping quote is ready — ${data.waybillNo}`;
  const text = `Hi ${data.senderName},

Your waybill has been reviewed and quoted. Complete payment to confirm the shipment.

Waybill Number: ${data.waybillNo}
Route:          ${data.fromLocation} → ${data.toLocation}
Shipping Fee:   ${amount}

Accept the quote and pay here: ${data.payUrl}

© 2026 TransHub Technologies Ltd.`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
        <tr><td style="background:#2563EB;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#fff">TransHub</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">Hi ${h.senderName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151">Your shipping quote is ready. Complete payment below to confirm collection.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px">
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;width:38%">Waybill No.</td><td style="padding:10px 16px;font-size:14px;font-weight:bold;color:#111827;font-family:monospace">${h.waybillNo}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Route</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.fromLocation} → ${h.toLocation}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Shipping Fee</td><td style="padding:10px 16px;font-size:14px;font-weight:bold;color:#2563EB;border-top:1px solid #e5e7eb">${h.amount}</td></tr>
          </table>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background:#2563EB">
            <a href="${data.payUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#fff;text-decoration:none">Accept &amp; Pay</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TransHub Technologies Ltd.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

export interface WaybillConfirmedData {
  senderName:   string;
  waybillNo:    string;
  fromLocation: string;
  toLocation:   string;
  trackUrl:     string;
}

export function waybillConfirmedEmail(data: WaybillConfirmedData): {
  subject: string; text: string; html: string;
} {
  const h = {
    senderName:   escapeHtml(data.senderName),
    waybillNo:    escapeHtml(data.waybillNo),
    fromLocation: escapeHtml(data.fromLocation),
    toLocation:   escapeHtml(data.toLocation),
  };
  const subject = `Waybill confirmed — ${data.waybillNo}`;
  const text = `Hi ${data.senderName},

Your waybill has been confirmed and will be collected shortly.

Waybill Number: ${data.waybillNo}
Route:          ${data.fromLocation} → ${data.toLocation}

Share your waybill number with the recipient so they can track the parcel.
Track here: ${data.trackUrl}

© 2026 TransHub Technologies Ltd.`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
        <tr><td style="background:#16a34a;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#fff">TransHub</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">Hi ${h.senderName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151">Your waybill is confirmed. We'll collect the parcel shortly.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px">
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;width:38%">Waybill No.</td><td style="padding:10px 16px;font-size:14px;font-weight:bold;color:#111827;font-family:monospace">${h.waybillNo}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Route</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.fromLocation} → ${h.toLocation}</td></tr>
          </table>
          <p style="margin:0 0 16px;font-size:13px;color:#374151">Share the waybill number <strong>${h.waybillNo}</strong> with the recipient so they can track their parcel.</p>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background:#16a34a">
            <a href="${data.trackUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#fff;text-decoration:none">Track Parcel</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TransHub Technologies Ltd.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

export interface WaybillDeliveredData {
  recipientName: string;
  waybillNo:     string;
  fromLocation:  string;
  toLocation:    string;
}

export function waybillDeliveredEmail(data: WaybillDeliveredData): {
  subject: string; text: string; html: string;
} {
  const h = {
    recipientName: escapeHtml(data.recipientName),
    waybillNo:     escapeHtml(data.waybillNo),
    fromLocation:  escapeHtml(data.fromLocation),
    toLocation:    escapeHtml(data.toLocation),
  };
  const subject = `Your parcel has been delivered — ${data.waybillNo}`;
  const text = `Hi ${data.recipientName},

Your parcel has been delivered.

Waybill Number: ${data.waybillNo}
Route:          ${data.fromLocation} → ${data.toLocation}

Thank you for using TransHub.

© 2026 TransHub Technologies Ltd.`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
        <tr><td style="background:#16a34a;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#fff">TransHub</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">Hi ${h.recipientName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151">Your parcel has been <strong>delivered</strong>. 🎉</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px">
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;width:38%">Waybill No.</td><td style="padding:10px 16px;font-size:14px;font-weight:bold;color:#111827;font-family:monospace">${h.waybillNo}</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Route</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.fromLocation} → ${h.toLocation}</td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#6b7280">Thank you for using TransHub.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TransHub Technologies Ltd.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export interface PasswordResetData {
  fullName: string;
  resetUrl: string; // contains the one-time token in its query string
}

export function passwordResetEmail(data: PasswordResetData): {
  subject: string;
  text: string;
  html: string;
} {
  const { fullName, resetUrl } = data;
  const h = { fullName: escapeHtml(fullName) };

  const subject = "Reset your TransHub password";

  const text = `Hi ${fullName},

We received a request to reset the password for your TransHub account.

Reset your password using the link below (it expires in 1 hour):
${resetUrl}

If you didn't request this, you can safely ignore this email — your password
won't change until you create a new one using the link above.

© 2026 TransHub Technologies Ltd.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#1E40AF;padding:28px 32px">
            <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff">TransHub</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">Hi ${h.fullName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151">We received a request to reset the password for your TransHub account. Click the button below to choose a new one.</p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td style="border-radius:6px;background:#2563EB">
                  <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none">Reset Password</a>
                </td>
              </tr>
            </table>

            <!-- Expiry notice -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;margin-bottom:24px">
              <tr>
                <td style="padding:14px 20px;font-size:13px;color:#1e3a8a">
                  This link expires in <strong>1 hour</strong>. If it expires, just request a new one from the login page.
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;color:#6b7280">If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="margin:0;font-size:12px;color:#2563EB;word-break:break-all">${resetUrl}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:12px;color:#9ca3af">If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

export interface OperatorWelcomeData {
  contactName: string;
  companyName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

export function operatorWelcomeEmail(data: OperatorWelcomeData): {
  subject: string;
  text: string;
  html: string;
} {
  const { contactName, companyName, email, tempPassword, loginUrl } = data;

  // HTML-escaped copies for the markup body (plain-text body uses raw values).
  const h = {
    contactName:  escapeHtml(contactName),
    companyName:  escapeHtml(companyName),
    email:        escapeHtml(email),
    tempPassword: escapeHtml(tempPassword),
  };

  const subject = "Welcome to TransHub — Your operator account is ready";

  const text = `Hi ${contactName},

${companyName} has been approved on TransHub.

YOUR LOGIN CREDENTIALS
-----------------------
Login URL:  ${loginUrl}
Email:      ${email}
Password:   ${tempPassword}

This is a one-time password. Please change it immediately after your first login.

Log in now: ${loginUrl}

If you did not apply to join TransHub, please ignore this email.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#16a34a;padding:28px 32px">
            <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff">TransHub</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#111827">Hi ${h.contactName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151"><strong>${h.companyName}</strong> has been approved on TransHub. Welcome aboard!</p>

            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin-bottom:24px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:bold;color:#15803d;text-transform:uppercase;letter-spacing:.05em">Your Login Credentials</p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#6b7280;padding-bottom:6px;padding-right:16px;white-space:nowrap">Login URL</td>
                      <td style="font-size:13px;color:#111827;padding-bottom:6px"><a href="${loginUrl}" style="color:#16a34a">${loginUrl}</a></td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;padding-bottom:6px;padding-right:16px;white-space:nowrap">Email</td>
                      <td style="font-size:13px;color:#111827;padding-bottom:6px">${h.email}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;padding-right:16px;white-space:nowrap">Password</td>
                      <td style="font-size:14px;font-weight:bold;color:#111827;font-family:monospace;letter-spacing:.1em">${h.tempPassword}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Security warning -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde047;border-radius:6px;margin-bottom:24px">
              <tr>
                <td style="padding:14px 20px;font-size:13px;color:#854d0e">
                  <strong>Important:</strong> This is a one-time password. Please change it immediately after your first login.
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:6px;background:#16a34a">
                  <a href="${loginUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none">Log In Now</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:12px;color:#9ca3af">If you did not apply to join TransHub, please ignore this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
