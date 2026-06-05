// Package response provides standardized JSON response helpers for Gin handlers.
// Every API response follows a consistent envelope so the frontend can always
// inspect the same fields regardless of the endpoint.
package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Envelope is the top-level JSON wrapper for every API response.
type Envelope struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
	Meta    *Meta  `json:"meta,omitempty"`
}

// Meta carries pagination information for list endpoints.
type Meta struct {
	Page    int `json:"page"`
	PerPage int `json:"perPage"`
	Total   int `json:"total"`
	Pages   int `json:"pages"`
}

// OK writes a 200 JSON response with data.
func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Envelope{Success: true, Data: data})
}

// OKMessage writes a 200 JSON response with a message and optional data.
func OKMessage(c *gin.Context, message string, data any) {
	c.JSON(http.StatusOK, Envelope{Success: true, Message: message, Data: data})
}

// Created writes a 201 JSON response.
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, Envelope{Success: true, Data: data})
}

// NoContent writes a 204 response (no body).
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// OKList writes a 200 response with data and pagination metadata.
func OKList(c *gin.Context, data any, page, perPage, total int) {
	pages := total / perPage
	if total%perPage > 0 {
		pages++
	}
	c.JSON(http.StatusOK, Envelope{
		Success: true,
		Data:    data,
		Meta:    &Meta{Page: page, PerPage: perPage, Total: total, Pages: pages},
	})
}

// BadRequest writes a 400 error response.
func BadRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, Envelope{Success: false, Error: msg})
}

// Unauthorized writes a 401 error response.
func Unauthorized(c *gin.Context, msg string) {
	c.JSON(http.StatusUnauthorized, Envelope{Success: false, Error: msg})
}

// Forbidden writes a 403 error response.
func Forbidden(c *gin.Context, msg string) {
	c.JSON(http.StatusForbidden, Envelope{Success: false, Error: msg})
}

// NotFound writes a 404 error response.
func NotFound(c *gin.Context, msg string) {
	c.JSON(http.StatusNotFound, Envelope{Success: false, Error: msg})
}

// Conflict writes a 409 error response.
func Conflict(c *gin.Context, msg string) {
	c.JSON(http.StatusConflict, Envelope{Success: false, Error: msg})
}

// UnprocessableEntity writes a 422 error response.
func UnprocessableEntity(c *gin.Context, msg string) {
	c.JSON(http.StatusUnprocessableEntity, Envelope{Success: false, Error: msg})
}

// InternalServerError writes a 500 error response.
// In production mode the raw error message is hidden from the client.
func InternalServerError(c *gin.Context, msg string) {
	c.JSON(http.StatusInternalServerError, Envelope{Success: false, Error: msg})
}
