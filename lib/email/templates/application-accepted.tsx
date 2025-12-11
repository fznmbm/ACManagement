import * as React from "react";

interface ApplicationAcceptedEmailProps {
  parentName: string;
  childFirstName: string;
  childLastName: string;
  applicationNumber: string;
  studentNumber: string;
  academicYear: string;
}

export const ApplicationAcceptedEmail = ({
  parentName,
  childFirstName,
  childLastName,
  applicationNumber,
  studentNumber,
  academicYear,
}: ApplicationAcceptedEmailProps) => (
  <div
    style={{
      fontFamily: "Arial, sans-serif",
      maxWidth: "600px",
      margin: "0 auto",
    }}
  >
    <div
      style={{
        backgroundColor: "#16a34a",
        padding: "30px",
        textAlign: "center",
      }}
    >
      <h1 style={{ color: "white", margin: 0 }}>Al Hikmah Institute Crawley</h1>
      <p style={{ color: "white", margin: "10px 0 0 0" }}>
        Islamic Educational Centre
      </p>
    </div>

    <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
      <div
        style={{
          backgroundColor: "#dcfce7",
          padding: "20px",
          borderRadius: "8px",
          border: "2px solid #16a34a",
          textAlign: "center",
          margin: "0 0 30px 0",
        }}
      >
        <h2 style={{ color: "#166534", margin: 0, fontSize: "24px" }}>
          Application Accepted!
        </h2>
      </div>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>Dear {parentName},</p>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
        <strong>Assalamu Alaikum,</strong>
      </p>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
        We are delighted to inform you that the application for{" "}
        <strong>
          {childFirstName} {childLastName}
        </strong>
        has been <strong style={{ color: "#16a34a" }}>ACCEPTED</strong> for the{" "}
        {academicYear} academic year!
      </p>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          margin: "20px 0",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "10px 0",
                  color: "#6b7280",
                  fontWeight: "bold",
                }}
              >
                Application Number:
              </td>
              <td
                style={{
                  padding: "10px 0",
                  color: "#1f2937",
                  textAlign: "right",
                }}
              >
                {applicationNumber}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "10px 0",
                  color: "#6b7280",
                  fontWeight: "bold",
                }}
              >
                Student Number:
              </td>
              <td
                style={{
                  padding: "10px 0",
                  color: "#16a34a",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                {studentNumber}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "10px 0",
                  color: "#6b7280",
                  fontWeight: "bold",
                }}
              >
                Academic Year:
              </td>
              <td
                style={{
                  padding: "10px 0",
                  color: "#1f2937",
                  textAlign: "right",
                }}
              >
                {academicYear}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          backgroundColor: "#dbeafe",
          padding: "20px",
          borderRadius: "8px",
          borderLeft: "4px solid #3b82f6",
          margin: "20px 0",
        }}
      >
        <h3 style={{ color: "#1e40af", margin: "0 0 15px 0" }}>
          📋 Next Steps:
        </h3>
        <ol
          style={{
            color: "#1e40af",
            margin: 0,
            paddingLeft: "20px",
            lineHeight: "1.8",
          }}
        >
          <li>Complete the registration form (link will be sent separately)</li>
          <li>Submit required documents (ID proof, medical records)</li>
          <li>Pay the registration fee</li>
          <li>Attend the orientation session (date will be communicated)</li>
        </ol>
      </div>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
        We look forward to welcoming <strong>{childFirstName}</strong> to Al
        Hikmah Institute Crawley! If you have any questions, please contact us
        at{" "}
        <a
          href="mailto:alhikmahinstitutecrawley@gmail.com"
          style={{ color: "#16a34a" }}
        >
          alhikmahinstitutecrawley@gmail.com
        </a>
      </p>

      <p style={{ color: "#4b5563", lineHeight: "1.6", marginBottom: 0 }}>
        <strong>JazakAllah Khair,</strong>
        <br />
        Al Hikmah Institute Crawley
      </p>
    </div>

    <div
      style={{
        backgroundColor: "#1f2937",
        padding: "20px",
        textAlign: "center",
        color: "#9ca3af",
        fontSize: "12px",
      }}
    >
      <p style={{ margin: 0 }}>
        © 2025 Al Hikmah Institute Crawley. All rights reserved.
      </p>
      <p style={{ margin: "10px 0 0 0" }}>
        Crawley, West Sussex | alhikmahinstitutecrawley@gmail.com
      </p>
    </div>
  </div>
);

export default ApplicationAcceptedEmail;
