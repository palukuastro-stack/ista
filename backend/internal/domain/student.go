package domain

import "time"

// StudentStatus represents the enrollment state of a student.
type StudentStatus string

const (
	StudentStatusActive    StudentStatus = "active"
	StudentStatusPending   StudentStatus = "pending"
	StudentStatusSuspended StudentStatus = "suspended"
	StudentStatusExcluded  StudentStatus = "excluded"
)

// Student contains the academic profile of a student.
// It is linked 1-to-1 with a User record.
type Student struct {
	ID             string        `json:"id"`
	Matricule      string        `json:"matricule"`
	FirstName      string        `json:"firstName"`
	LastName       string        `json:"lastName"`
	MiddleName     string        `json:"middleName"`
	BirthDate      string        `json:"birthDate"` // ISO date string
	Email          string        `json:"email"`
	Phone          string        `json:"phone"`
	Gender         string        `json:"gender"` // "M" | "F"
	PromotionID    string        `json:"promotionId"`
	FacultyID      string        `json:"facultyId"`
	Status         StudentStatus `json:"status"`
	EnrollmentDate string        `json:"enrollmentDate"` // ISO date string
	Average        float64       `json:"average"`
	CreatedAt      time.Time     `json:"createdAt"`
	UpdatedAt      time.Time     `json:"updatedAt"`
}
