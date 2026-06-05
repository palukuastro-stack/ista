package domain

import "time"

// AssignmentType classifies how students are expected to respond.
type AssignmentType string

const (
	AssignmentTypeForm AssignmentType = "Formulaire"
	AssignmentTypePDF  AssignmentType = "PDF"
	AssignmentTypeLink AssignmentType = "Lien"
)

// Assignment is a task created by a teacher for students in a course.
type Assignment struct {
	ID              string         `json:"id"`
	CourseID        string         `json:"courseId"`
	TeacherID       string         `json:"teacherId"`
	Title           string         `json:"title"`
	Description     string         `json:"description"`
	DueDate         string         `json:"dueDate"`          // ISO date
	DeadlineTime    string         `json:"deadlineTime,omitempty"`
	DurationMinutes int            `json:"durationMinutes,omitempty"`
	Type            AssignmentType `json:"type"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
}

// Submission is a student's response to an assignment.
type Submission struct {
	ID           string    `json:"id"`
	AssignmentID string    `json:"assignmentId"`
	StudentID    string    `json:"studentId"`
	Content      string    `json:"content"`
	SubmittedAt  time.Time `json:"submittedAt"`
	Grade        *float64  `json:"grade,omitempty"`
	Feedback     string    `json:"feedback,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// ResourceType classifies a course resource.
type ResourceType string

const (
	ResourceTypePDF   ResourceType = "pdf"
	ResourceTypeVideo ResourceType = "video"
	ResourceTypeLink  ResourceType = "link"
	ResourceTypeDoc   ResourceType = "doc"
)

// CourseResource is a learning material published by a teacher.
type CourseResource struct {
	ID        string       `json:"id"`
	CourseID  string       `json:"courseId"`
	TeacherID string       `json:"teacherId"`
	Title     string       `json:"title"`
	Type      ResourceType `json:"type"`
	URL       string       `json:"url"`
	CreatedAt time.Time    `json:"createdAt"`
}
