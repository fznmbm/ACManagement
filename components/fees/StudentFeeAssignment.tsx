"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface StudentFeeAssignmentProps {
  studentId: string;
  onUpdate?: () => void;
}

interface Assignment {
  id: string;
  fee_structure_id: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  fee_structures: {
    name: string;
    amount: number;
    frequency: string;
  };
}

export default function StudentFeeAssignment({
  studentId,
  onUpdate,
}: StudentFeeAssignmentProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableStructures, setAvailableStructures] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState("");
  const [startDate, setStartDate] = useState("");
  const [showEndedAssignments, setShowEndedAssignments] = useState(false);

  const supabase = createClient();
  const activeAssignments = assignments.filter((a) => a.is_active);
  const endedAssignments = assignments.filter((a) => !a.is_active);

  useEffect(() => {
    fetchAssignments();
    fetchAvailableStructures();
  }, [studentId]);

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("student_fee_assignments")
      .select(
        `
        *,
        fee_structures (name, amount, frequency)
      `
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (!error) {
      setAssignments(data || []);
    }
  };

  const fetchAvailableStructures = async () => {
    try {
      // Get all active fee structures
      const { data: allStructures, error: structuresError } = await supabase
        .from("fee_structures")
        .select("id, name, amount, frequency")
        .eq("is_active", true)
        .order("name");

      if (structuresError) throw structuresError;

      // Get ONLY ACTIVE assignments for this student
      const { data: activeAssignments, error: assignmentsError } =
        await supabase
          .from("student_fee_assignments")
          .select("fee_structure_id")
          .eq("student_id", studentId)
          .eq("is_active", true); // ONLY active assignments

      if (assignmentsError) throw assignmentsError;

      // Filter out structures that have active assignments
      const assignedStructureIds =
        activeAssignments?.map((a) => a.fee_structure_id) || [];
      const availableStructures =
        allStructures?.filter((s) => !assignedStructureIds.includes(s.id)) ||
        [];

      setAvailableStructures(availableStructures);
    } catch (error) {
      console.error("Error fetching available structures:", error);
      setAvailableStructures([]);
    }
  };

  const addAssignment = async () => {
    if (!selectedStructure || !startDate) {
      alert("Please select a fee structure and start date");
      return;
    }

    try {
      // Check for ANY assignment (active OR ended) for this fee structure
      const { data: existingAssignments, error: checkError } = await supabase
        .from("student_fee_assignments")
        .select("id, is_active, end_date")
        .eq("student_id", studentId)
        .eq("fee_structure_id", selectedStructure);

      if (checkError) throw checkError;

      // Check if there's an active assignment
      const activeAssignment = existingAssignments?.find((a) => a.is_active);
      if (activeAssignment) {
        const feeStructureName = availableStructures.find(
          (s) => s.id === selectedStructure
        )?.name;
        alert(
          `This student already has an active assignment for "${feeStructureName}".`
        );
        return;
      }

      // Check if there's an ended assignment
      const endedAssignment = existingAssignments?.find((a) => !a.is_active);
      if (endedAssignment) {
        const feeStructureName = availableStructures.find(
          (s) => s.id === selectedStructure
        )?.name;
        const reactivate = confirm(
          `You previously had "${feeStructureName}" but ended it.\n\n` +
            `Would you like to:\n` +
            `• REACTIVATE the existing assignment (Click OK)\n` +
            `• CREATE a new assignment (Click Cancel)`
        );

        if (reactivate) {
          await reactivateAssignment(endedAssignment.id, feeStructureName);
          setShowAddForm(false);
          setSelectedStructure("");
          setStartDate("");
          return;
        }
        // If they choose "Cancel", continue to create new assignment
      }

      // Create new assignment
      const { error: insertError } = await supabase
        .from("student_fee_assignments")
        .insert({
          student_id: studentId,
          fee_structure_id: selectedStructure,
          start_date: startDate,
          is_active: true,
        });

      if (insertError) {
        console.error("Error inserting assignment:", insertError);
        if (insertError.code === "23505") {
          alert(
            "This fee assignment already exists. Each student can only have one active assignment per fee type."
          );
        } else {
          alert(`Failed to add fee assignment: ${insertError.message}`);
        }
        return;
      }

      // Success
      await fetchAssignments();
      await fetchAvailableStructures();
      setShowAddForm(false);
      setSelectedStructure("");
      setStartDate("");
      onUpdate?.();

      alert(
        "Fee assignment added successfully! Generate invoices to create billing records."
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      alert(`An unexpected error occurred: ${error.message}`);
    }
  };

  const removeAssignment = async (id: string, assignmentName: string) => {
    // Check if any invoices exist for this assignment
    const { data: invoices, error: invoiceCheckError } = await supabase
      .from("fee_invoices")
      .select("id")
      .eq("student_id", studentId)
      .eq(
        "fee_structure_id",
        assignments.find((a) => a.id === id)?.fee_structure_id
      );

    if (invoiceCheckError) {
      console.error("Error checking invoices:", invoiceCheckError);
      alert("Unable to verify if invoices exist. Please try again.");
      return;
    }

    if (invoices && invoices.length > 0) {
      alert(
        `Cannot delete "${assignmentName}" because invoices have been generated for this fee. Use "End" instead to stop future billing.`
      );
      return;
    }

    if (
      !confirm(
        `Permanently DELETE "${assignmentName}" assignment? This cannot be undone.`
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("student_fee_assignments")
        .delete() // Actually delete the record
        .eq("id", id);

      if (!error) {
        fetchAssignments();
        fetchAvailableStructures();
        onUpdate?.();
        alert("Fee assignment deleted permanently");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    }
  };

  const endAssignment = async (id: string) => {
    if (!confirm("End this fee assignment? This will stop future billing."))
      return;

    try {
      const { error } = await supabase
        .from("student_fee_assignments")
        .update({
          is_active: false,
          end_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", id);

      if (!error) {
        fetchAssignments();
        fetchAvailableStructures(); // Refresh available structures
        onUpdate?.();
        alert("Fee assignment ended successfully");
      }
    } catch (error) {
      console.error("Error ending assignment:", error);
      alert("Failed to end assignment");
    }
  };

  const reactivateAssignment = async (id: string, feeStructureName: string) => {
    if (
      !confirm(`Reactivate ${feeStructureName}? This will start billing again.`)
    )
      return;

    try {
      const { error } = await supabase
        .from("student_fee_assignments")
        .update({
          is_active: true,
          end_date: null,
          start_date: new Date().toISOString().split("T")[0], // New start date
        })
        .eq("id", id);

      if (!error) {
        fetchAssignments();
        fetchAvailableStructures();
        onUpdate?.();
        alert("Fee assignment reactivated successfully");
      }
    } catch (error) {
      console.error("Error reactivating assignment:", error);
      alert("Failed to reactivate assignment");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Fee Assignments</h4>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-outline btn-sm flex items-center space-x-1"
        >
          <Plus className="h-3 w-3" />
          <span>Add</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-muted p-3 rounded border">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={selectedStructure}
              onChange={(e) => setSelectedStructure(e.target.value)}
              className="form-input text-sm"
            >
              <option value="">Select Fee Structure</option>
              {availableStructures.map((structure: any) => (
                <option key={structure.id} value={structure.id}>
                  {structure.name} (£{structure.amount})
                </option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input text-sm"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-outline btn-sm"
            >
              Cancel
            </button>
            <button onClick={addAssignment} className="btn-primary btn-sm">
              Add
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Active Assignments - Always Show */}
        {activeAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="flex items-center justify-between p-2 border rounded text-sm"
          >
            <div>
              <p className="font-medium">{assignment.fee_structures.name}</p>
              <p className="text-xs text-muted-foreground">
                £{assignment.fee_structures.amount} •{" "}
                {assignment.fee_structures.frequency}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => endAssignment(assignment.id)}
                className="text-orange-600 hover:text-orange-700 text-xs px-2 py-1 border border-orange-600 rounded"
              >
                End
              </button>
              <button
                onClick={() =>
                  removeAssignment(
                    assignment.id,
                    assignment.fee_structures.name
                  )
                }
                className="text-red-600 hover:text-red-700"
                title="Permanently delete (only if no invoices generated)"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Ended Assignments - Collapsible */}
        {endedAssignments.length > 0 && (
          <div>
            <button
              onClick={() => setShowEndedAssignments(!showEndedAssignments)}
              className="w-full text-left text-sm text-muted-foreground hover:text-foreground py-2 border-t border-dashed"
            >
              {showEndedAssignments ? "▼" : "▶"} Ended Assignments (
              {endedAssignments.length})
            </button>

            {showEndedAssignments && (
              <div className="space-y-2 mt-2">
                {endedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-2 border rounded text-sm opacity-50 bg-gray-50 dark:bg-gray-800"
                  >
                    <div>
                      <p className="font-medium">
                        {assignment.fee_structures.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        £{assignment.fee_structures.amount} •{" "}
                        {assignment.fee_structures.frequency}• Ended{" "}
                        {assignment.end_date}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          reactivateAssignment(
                            assignment.id,
                            assignment.fee_structures.name
                          )
                        }
                        className="text-green-600 hover:text-green-700 text-xs px-2 py-1 border border-green-600 rounded"
                      >
                        Reactivate
                      </button>
                      <button
                        onClick={() =>
                          removeAssignment(
                            assignment.id,
                            assignment.fee_structures.name
                          )
                        }
                        className="text-red-600 hover:text-red-700"
                        title="Permanently delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Assignments Message */}
        {activeAssignments.length === 0 && endedAssignments.length === 0 && (
          <p className="text-muted-foreground text-center py-4 text-sm">
            No fee assignments yet. Click "Add" to assign fees to this student.
          </p>
        )}
      </div>
    </div>
  );
}
