import * as React from "react";

interface ApplicationRejectedEmailProps {
  parentName: string;
  childFirstName: string;
  childLastName: string;
  applicationNumber: string;
  rejectionReason: string;
  academicYear: string;
}

export const ApplicationRejectedEmail = ({
  parentName,
  childFirstName,
  childLastName,
  applicationNumber,
  rejectionReason,
  academicYear,
}: ApplicationRejectedEmailProps) => (
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
      <h2 style={{ color: "#1f2937", marginTop: 0 }}>
        Application Status Update
      </h2>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>Dear {parentName},</p>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
        <strong>Assalamu Alaikum,</strong>
      </p>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
        Thank you for your interest in Al Hikmah Institute Crawley and for
        submitting an application for{" "}
        <strong>
          {childFirstName} {childLastName}
        </strong>
        .
      </p>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
        After careful consideration, we regret to inform you that we are unable
        to offer a place to {childFirstName} for the {academicYear} academic
        year at this time.
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

      {rejectionReason && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            padding: "15px",
            borderRadius: "8px",
            borderLeft: "4px solid #ef4444",
            margin: "20px 0",
          }}
        >
          <p style={{ color: "#7f1d1d", margin: 0, lineHeight: "1.6" }}>
            <strong>Reason:</strong>
            <br />
            {rejectionReason}
          </p>
        </div>
      )}

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
        We understand this may be disappointing news. Please know that this
        decision was made after careful review of all applications and
        consideration of our current capacity.
      </p>

      <div
        style={{
          backgroundColor: "#dbeafe",
          padding: "15px",
          borderRadius: "8px",
          borderLeft: "4px solid #3b82f6",
          margin: "20px 0",
        }}
      >
        <p style={{ color: "#1e40af", margin: 0, lineHeight: "1.6" }}>
          We encourage you to apply again in future academic years. If you have
          any questions or would like to discuss this further, please contact us
          at{" "}
          <a
            href="mailto:alhikmahinstitutecrawley@gmail.com"
            style={{ color: "#16a34a" }}
          >
            alhikmahinstitutecrawley@gmail.com
          </a>
        </p>
      </div>

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

export default ApplicationRejectedEmail;
