import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { certId: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: cert } = await supabase
    .from("certificates")
    .select("*, students(first_name, last_name, student_number)")
    .eq("id", params.certId)
    .single();

  if (!cert)
    return NextResponse.json(
      { error: "Certificate not found" },
      { status: 404 },
    );

  // Generate simple PDF-like HTML certificate
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; text-align: center; padding: 60px; background: white; }
    .border { border: 8px double #16a34a; padding: 40px; margin: 20px; }
    .title { font-size: 36px; color: #16a34a; margin-bottom: 10px; }
    .subtitle { font-size: 18px; color: #666; margin-bottom: 30px; }
    .name { font-size: 28px; font-weight: bold; margin: 20px 0; border-bottom: 2px solid #16a34a; padding-bottom: 10px; display: inline-block; }
    .cert-type { font-size: 22px; color: #333; margin: 20px 0; }
    .details { font-size: 14px; color: #666; margin-top: 30px; }
    .footer { margin-top: 40px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="border">
    <div class="title">Al Hikmah Institute Crawley</div>
    <div class="subtitle">Certificate of Achievement</div>
    <p>This is to certify that</p>
    <div class="name">${cert.students?.first_name} ${cert.students?.last_name}</div>
    <div class="cert-type">${cert.certificate_type?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
    <div class="details">
      Certificate Number: ${cert.certificate_number}<br/>
      Issue Date: ${new Date(cert.issue_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}<br/>
      Student Number: ${cert.students?.student_number}
    </div>
    <div class="footer">
      JazakAllah Khair · Al Hikmah Institute Crawley<br/>
      +44 7411 061242 | alhikmahinstitutecrawley@gmail.com
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="certificate-${cert.certificate_number}.html"`,
    },
  });
}
