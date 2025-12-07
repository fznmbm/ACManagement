"use client";

import { useState } from "react";
import StudentMessageForm from "@/components/messages/StudentMessageForm";
import ClassMessageForm from "@/components/messages/ClassMessageForm";

export default function MessagesPage() {
  const [activeView, setActiveView] = useState<"choose" | "student" | "class">(
    "choose"
  );

  function handleSuccess() {
    // Return to choose view after successful send
    setActiveView("choose");
  }

  function handleCancel() {
    setActiveView("choose");
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Send messages to parents via WhatsApp or Email
          </p>
        </div>

        {/* Choose View */}
        {activeView === "choose" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Message One Student */}
            <button
              onClick={() => setActiveView("student")}
              className="p-8 border-2 border-input rounded-lg hover:border-primary hover:bg-accent transition-all duration-200 text-left group"
            >
              <div className="text-4xl mb-4">👤</div>
              <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                Message One Student
              </h2>
              <p className="text-muted-foreground">
                Send a message to a specific student's parent (father or mother)
              </p>
              <div className="mt-4 text-sm text-muted-foreground">
                ✓ Choose student
                <br />
                ✓ Select parent (father/mother)
                <br />✓ WhatsApp or Email
              </div>
            </button>

            {/* Message Whole Class */}
            <button
              onClick={() => setActiveView("class")}
              className="p-8 border-2 border-input rounded-lg hover:border-primary hover:bg-accent transition-all duration-200 text-left group"
            >
              <div className="text-4xl mb-4">👥</div>
              <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                Message Whole Class
              </h2>
              <p className="text-muted-foreground">
                Send announcement or message to all parents in a class
              </p>
              <div className="mt-4 text-sm text-muted-foreground">
                ✓ Select class
                <br />
                ✓ Copy to WhatsApp group
                <br />✓ Or send bulk emails
              </div>
            </button>
          </div>
        )}

        {/* Student Message Form */}
        {activeView === "student" && (
          <div className="bg-card border border-input rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                Message Individual Student
              </h2>
              <button
                onClick={handleCancel}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            </div>
            <StudentMessageForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Class Message Form */}
        {activeView === "class" && (
          <div className="bg-card border border-input rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Message Whole Class</h2>
              <button
                onClick={handleCancel}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            </div>
            <ClassMessageForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
