// Package main is the entry point for the ISTA-GOMA backend API server.
// It wires together all services, repositories, handlers, and middleware
// and starts the HTTP server.
package main

import (
        "context"
        "fmt"
        "log"
        "net/http"
        "os"
        "os/signal"
        "syscall"
        "time"

        "github.com/gin-gonic/gin"
        "github.com/ista-goma/platform/internal/academic"
        "github.com/ista-goma/platform/internal/auth"
        "github.com/ista-goma/platform/internal/config"
        "github.com/ista-goma/platform/internal/database"
        "github.com/ista-goma/platform/internal/email"
        "github.com/ista-goma/platform/internal/grades"
        "github.com/ista-goma/platform/internal/middleware"
        "github.com/ista-goma/platform/internal/notifications"
        "github.com/ista-goma/platform/internal/students"
        "github.com/ista-goma/platform/internal/teachers"
)

func main() {
        // ── Config ────────────────────────────────────────────────────────────────
        cfg, err := config.Load()
        if err != nil {
                log.Fatalf("loading config: %v", err)
        }

        if cfg.Env == "production" {
                gin.SetMode(gin.ReleaseMode)
        }

        // ── Database ──────────────────────────────────────────────────────────────
        ctx := context.Background()
        pool, err := database.NewPool(ctx, cfg.DatabaseURL)
        if err != nil {
                log.Fatalf("connecting to database: %v", err)
        }
        defer pool.Close()
        log.Println("✓ Database connected")

        // ── Services ──────────────────────────────────────────────────────────────
        emailSvc := email.NewService(cfg.ResendAPIKey, cfg.EmailFromName, cfg.EmailFromAddr)

        jwtSvc := auth.NewJWTService(cfg.JWTSecret, cfg.JWTExpiryHours)

        authRepo := auth.NewRepository(pool)
        authSvc  := auth.NewService(authRepo, jwtSvc, emailSvc, cfg.FrontendURL)

        academicRepo := academic.NewRepository(pool)
        academicSvc  := academic.NewService(academicRepo)

        studentRepo := students.NewRepository(pool)
        studentSvc  := students.NewService(studentRepo)

        teacherRepo := teachers.NewRepository(pool)
        teacherSvc  := teachers.NewService(teacherRepo)

        notifRepo := notifications.NewRepository(pool)
        notifSvc  := notifications.NewService(notifRepo)

        gradeRepo := grades.NewRepository(pool)
        gradeSvc  := grades.NewService(gradeRepo, notifSvc)

        // ── Handlers ──────────────────────────────────────────────────────────────
        authHandler   := auth.NewHandler(authSvc)
        academicHnd   := academic.NewHandler(academicSvc)
        studentHnd    := students.NewHandler(studentSvc)
        teacherHnd    := teachers.NewHandler(teacherSvc)
        gradeHnd      := grades.NewHandler(gradeSvc)
        notifHnd      := notifications.NewHandler(notifSvc)

        // ── Router ────────────────────────────────────────────────────────────────
        r := gin.New()
        r.Use(gin.Recovery())
        r.Use(middleware.RequestLogger())

        // CORS — allow the frontend origin and localhost in development.
        allowedOrigins := []string{cfg.FrontendURL, "http://localhost:5000", "http://localhost:5173"}
        r.Use(middleware.CORS(allowedOrigins))

        // Health check (unauthenticated)
        r.GET("/health", func(c *gin.Context) {
                c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "ista-goma-api"})
        })

        // ── v1 API ────────────────────────────────────────────────────────────────
        v1 := r.Group("/api/v1")

        // Public auth routes (no JWT required)
        authGroup := v1.Group("/auth")
        authHandler.RegisterRoutes(authGroup)

        // Protected routes — all require a valid JWT
        protected := v1.Group("")
        protected.Use(middleware.Authenticate(jwtSvc))

        // Protected auth routes (e.g. /auth/me)
        authHandler.RegisterProtectedRoutes(protected)

        // Academic entities (accessible to all authenticated users; write ops
        // restricted per-handler via RequireRoles where needed)
        academicHnd.RegisterRoutes(protected)
        studentHnd.RegisterRoutes(protected)
        teacherHnd.RegisterRoutes(protected)
        gradeHnd.RegisterRoutes(protected)
        notifHnd.RegisterRoutes(protected)

        // ── Server ────────────────────────────────────────────────────────────────
        addr := fmt.Sprintf(":%s", cfg.Port)
        srv := &http.Server{
                Addr:         addr,
                Handler:      r,
                ReadTimeout:  15 * time.Second,
                WriteTimeout: 15 * time.Second,
                IdleTimeout:  60 * time.Second,
        }

        // Start in background
        go func() {
                log.Printf("✓ API server listening on %s (env=%s)", addr, cfg.Env)
                if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
                        log.Fatalf("server error: %v", err)
                }
        }()

        // Graceful shutdown on SIGINT/SIGTERM
        quit := make(chan os.Signal, 1)
        signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
        <-quit

        log.Println("shutting down server…")
        shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
        defer cancel()
        if err := srv.Shutdown(shutdownCtx); err != nil {
                log.Fatalf("forced shutdown: %v", err)
        }
        log.Println("server exited gracefully")
}
