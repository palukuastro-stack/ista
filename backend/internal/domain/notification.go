package domain

import "time"

// NotificationType identifies what business event triggered a notification.
type NotificationType string

const (
	NotifGradeModified  NotificationType = "grade_modified"
	NotifNewAppeal      NotificationType = "new_appeal"
	NotifAppealResolved NotificationType = "appeal_resolved"
	NotifCourseAssigned NotificationType = "course_assigned"
	NotifAccountCreated NotificationType = "account_created"
)

// AnnouncementScope controls who can see an announcement.
type AnnouncementScope string

const (
	AnnouncementScopeGlobal  AnnouncementScope = "global"
	AnnouncementScopeFaculty AnnouncementScope = "faculty"
	AnnouncementScopeCourse  AnnouncementScope = "course"
)

// AnnouncementPriority governs the visual weight of an announcement.
type AnnouncementPriority string

const (
	AnnouncementPriorityInfo      AnnouncementPriority = "info"
	AnnouncementPriorityImportant AnnouncementPriority = "important"
	AnnouncementPriorityUrgent    AnnouncementPriority = "urgent"
)

// Announcement is an official broadcast message from any authorised staff member.
type Announcement struct {
	ID       string               `json:"id"`
	Title    string               `json:"title"`
	Body     string               `json:"body"`
	Author   string               `json:"author"`
	Date     string               `json:"date"` // ISO date
	Audience string               `json:"audience"`
	Priority AnnouncementPriority `json:"priority"`
	Scope    AnnouncementScope    `json:"scope"`
	TargetID string               `json:"targetId,omitempty"`
	CreatedAt time.Time           `json:"createdAt"`
}

// Notification is a personal, targeted in-app alert for a specific user role.
type Notification struct {
	ID         string            `json:"id"`
	Type       NotificationType  `json:"type"`
	Message    string            `json:"message"`
	TargetRole Role              `json:"targetRole"`
	Read       bool              `json:"read"`
	Metadata   map[string]string `json:"metadata,omitempty"`
	CreatedAt  time.Time         `json:"createdAt"`
}
