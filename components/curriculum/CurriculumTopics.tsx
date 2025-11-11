// components/curriculum/CurriculumTopics.tsx
"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  GripVertical,
  BookOpen,
} from "lucide-react";

interface Topic {
  id: string;
  topic_name: string;
  description: string | null;
  content: string | null;
  sequence_order: number;
  learning_objectives: string | null;
}

interface CurriculumTopicsProps {
  topics: Topic[];
  subjectId: string;
  canManage: boolean;
}

export default function CurriculumTopics({
  topics,
  subjectId,
  canManage,
}: CurriculumTopicsProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  if (topics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No topics added yet</p>
        {canManage && (
          <p className="text-sm mt-2">
            Click "Add Topic" to create your first curriculum topic
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topics.map((topic, index) => {
        const isExpanded = expandedTopics.has(topic.id);

        return (
          <div
            key={topic.id}
            className="border border-border rounded-lg overflow-hidden"
          >
            {/* Topic Header */}
            <div className="flex items-center p-3 hover:bg-accent/50 transition-colors">
              {canManage && (
                <GripVertical className="h-4 w-4 text-muted-foreground mr-2 cursor-move" />
              )}

              <button
                onClick={() => toggleTopic(topic.id)}
                className="flex items-center flex-1 text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}

                <span className="flex items-center space-x-3 flex-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {topic.sequence_order}
                  </span>
                  <span className="font-medium">{topic.topic_name}</span>
                </span>
              </button>

              {canManage && (
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    className="p-1 hover:bg-accent rounded"
                    title="Edit Topic"
                  >
                    <Edit className="h-4 w-4 text-green-600" />
                  </button>
                  <button
                    className="p-1 hover:bg-accent rounded"
                    title="Delete Topic"
                    onClick={() => {
                      if (confirm("Delete this topic?")) {
                        alert("Delete functionality will be implemented");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Topic Content (Expanded) */}
            {isExpanded && (
              <div className="border-t border-border bg-muted/30 p-4 space-y-3">
                {topic.description && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm">{topic.description}</p>
                  </div>
                )}

                {topic.learning_objectives && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">
                      Learning Objectives
                    </p>
                    <p className="text-sm">{topic.learning_objectives}</p>
                  </div>
                )}

                {topic.content && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">
                      Content
                    </p>
                    <div className="text-sm whitespace-pre-wrap bg-card p-3 rounded border border-border">
                      {topic.content}
                    </div>
                  </div>
                )}

                {!topic.description &&
                  !topic.learning_objectives &&
                  !topic.content && (
                    <p className="text-sm text-muted-foreground italic">
                      No additional details available
                    </p>
                  )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
