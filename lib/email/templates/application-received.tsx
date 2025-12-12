import * as React from "react";

interface ApplicationReceivedEmailProps {
  parentName: string;
  childFirstName: string;
  childLastName: string;
  applicationNumber: string;
  academicYear: string;
  submissionDate: string;
}

export const ApplicationReceivedEmail = ({
  parentName,
  childFirstName,
  childLastName,
  applicationNumber,
  academicYear,
  submissionDate,
}: ApplicationReceivedEmailProps) => (
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
      <h2 style={{ color: "#1f2937", marginTop: 0 }}>Application Received</h2>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>Dear {parentName},</p>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
        <strong>Assalamu Alaikum,</strong>
      </p>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
        Thank you for submitting an application for{" "}
        <strong>
          {childFirstName} {childLastName}
        </strong>{" "}
        to Al Hikmah Institute Crawley.
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
            <tr>
              <td
                style={{
                  padding: "10px 0",
                  color: "#6b7280",
                  fontWeight: "bold",
                }}
              >
                Submitted On:
              </td>
              <td
                style={{
                  padding: "10px 0",
                  color: "#1f2937",
                  textAlign: "right",
                }}
              >
                {submissionDate}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
          <strong>What happens next?</strong>
          <br />
          We have received your application and it is currently being reviewed.
          You will receive a response within <strong>5-7 working days</strong>.
        </p>
      </div>

      <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
        Please keep your application number for reference. If you have any
        questions, feel free to contact us:
        <br />
        <strong>Phone:</strong>{" "}
        <a href="tel:+447411061242" style={{ color: "#16a34a" }}>
          +44 7411 061242
        </a>
        <br />
        <strong>Email:</strong>{" "}
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
        Crawley, West Sussex | +44 7411 061242|
        alhikmahinstitutecrawley@gmail.com
      </p>
    </div>
  </div>
);

export default ApplicationReceivedEmail;
