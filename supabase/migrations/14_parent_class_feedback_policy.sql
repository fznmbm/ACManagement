CREATE POLICY "Parents can view their children's class feedback"
  ON class_feedback_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_student_links
      JOIN students ON students.id = parent_student_links.student_id
      WHERE parent_student_links.parent_user_id = auth.uid()
      AND students.class_id = class_feedback_sessions.class_id
    )
  );