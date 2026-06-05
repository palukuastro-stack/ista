package domain

import "time"

// GradeStatus tracks whether a grade has been reviewed by the secretariat.
type GradeStatus string

const (
	GradeStatusPending   GradeStatus = "pending"
	GradeStatusValidated GradeStatus = "validated"
	GradeStatusRejected  GradeStatus = "rejected"
)

// GradeType classifies the type of assessment a grade is for.
type GradeType string

const (
	GradeTypeTD     GradeType = "TD"
	GradeTypeTP     GradeType = "TP"
	GradeTypeInterro GradeType = "Interro"
	GradeTypeExamen GradeType = "Examen"
)

// Grade is a single student result for a course assessment.
type Grade struct {
	ID              string      `json:"id"`
	StudentID       string      `json:"studentId"`
	CourseID        string      `json:"courseId"`
	PromotionID     string      `json:"promotionId"`
	Score           float64     `json:"score"`
	Status          GradeStatus `json:"status"`
	Session         string      `json:"session"` // e.g. "Janvier 2026"
	Type            GradeType   `json:"type"`
	AssessmentTitle string      `json:"assessmentTitle,omitempty"`
	CreatedAt       time.Time   `json:"createdAt"`
	UpdatedAt       time.Time   `json:"updatedAt"`
}

// AppealStatus tracks the resolution of a grade appeal.
type AppealStatus string

const (
	AppealStatusPending  AppealStatus = "pending"
	AppealStatusApproved AppealStatus = "approved"
	AppealStatusRejected AppealStatus = "rejected"
)

// GradeAppeal is a formal contestation submitted by a student for a specific grade.
type GradeAppeal struct {
	ID             string       `json:"id"`
	StudentID      string       `json:"studentId"`
	CourseID       string       `json:"courseId"`
	GradeID        string       `json:"gradeId"`
	Reason         string       `json:"reason"`
	Status         AppealStatus `json:"status"`
	Response       string       `json:"response,omitempty"`
	EstimatedGrade float64      `json:"estimatedGrade"`
	ProofURL       string       `json:"proofUrl,omitempty"`
	StatusMessage  string       `json:"statusMessage,omitempty"`
	CreatedAt      time.Time    `json:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt"`
}
