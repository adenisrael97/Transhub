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
  seats: string[];        // ["A1", "A2"]
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
  const { passengerName, from, to, departureTime, seats, operator, vehicleType, totalAmount, paymentRef, ticketUrl } = data;
  const seatList = seats.join(", ");
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
