// Package apperror defines domain-level error types that the service layer
// returns. Handlers translate these into the appropriate HTTP status codes so
// that business logic never depends on HTTP concepts.
package apperror

import "fmt"

// Kind enumerates the types of application error.
type Kind uint8

const (
	KindNotFound   Kind = iota + 1 // Resource does not exist
	KindConflict                   // Unique constraint or business rule violation
	KindForbidden                  // Caller lacks permission
	KindBadRequest                 // Invalid input
	KindUnauth                     // Not authenticated
)

// AppError carries a machine-readable kind and a human-readable message.
type AppError struct {
	Kind    Kind
	Message string
}

func (e *AppError) Error() string { return e.Message }

// New creates an AppError.
func New(kind Kind, msg string) *AppError {
	return &AppError{Kind: kind, Message: msg}
}

// Newf creates an AppError with a formatted message.
func Newf(kind Kind, format string, args ...any) *AppError {
	return &AppError{Kind: kind, Message: fmt.Sprintf(format, args...)}
}

// NotFound returns a KindNotFound error.
func NotFound(entity string) *AppError {
	return Newf(KindNotFound, "%s not found", entity)
}

// Conflict returns a KindConflict error.
func Conflict(msg string) *AppError { return New(KindConflict, msg) }

// Forbidden returns a KindForbidden error.
func Forbidden(msg string) *AppError { return New(KindForbidden, msg) }

// BadRequest returns a KindBadRequest error.
func BadRequest(msg string) *AppError { return New(KindBadRequest, msg) }

// Unauthorized returns a KindUnauth error.
func Unauthorized(msg string) *AppError { return New(KindUnauth, msg) }

// IsKind reports whether err is an AppError of the given kind.
func IsKind(err error, kind Kind) bool {
	if err == nil {
		return false
	}
	if ae, ok := err.(*AppError); ok {
		return ae.Kind == kind
	}
	return false
}
