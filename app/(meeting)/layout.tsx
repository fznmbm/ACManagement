export default function MeetingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-background">
          <div className="p-4 md:p-8">{children}</div>
        </div>
      </body>
    </html>
  );
}
