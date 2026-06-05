// Package domain defines the core business entities of the ISTA-GOMA platform.
// These structs are technology-agnostic — they contain no ORM tags or HTTP
// annotations so that they can be used freely across all layers.
package domain

import "time"

// Role enumerates every user role in the platform.
type Role string

const (
	RoleStudent             Role = "student"
	RoleTeacher             Role = "teacher"
	RoleApparitorat         Role = "apparitorat"
	RoleSecretariatFaculte  Role = "secretariat_faculte"
	RoleSecretariatGeneral  Role = "secretariat_general"
	RoleRectorat            Role = "rectorat"
)

// User is the central identity record.
// Each user may additionally be linked to a Student or Teacher profile via
// the RefID field.
type User struct {
	ID          string    `json:"id"`
	FirstName   string    `json:"firstName"`
	LastName    string    `json:"lastName"`
	MiddleName  string    `json:"middleName"`
	Email       string    `json:"email"`
	Role        Role      `json:"role"`
	FacultyID   string    `json:"facultyId,omitempty"`
	RefID       string    `json:"refId,omitempty"`   // Student or Teacher ID
	Phone       string    `json:"phone,omitempty"`
	Avatar      string    `json:"avatar,omitempty"`
	Description string    `json:"description,omitempty"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// UserCredentials holds the authentication details stored separately from the
// public User profile to keep password hashes out of API responses.
type UserCredentials struct {
	UserID       string
	PasswordHash string     // bcrypt hash — never transmitted over the wire
	ActivatedAt  *time.Time // nil until the user completes account activation
}
