// Package email provides a centralized email delivery service using Resend.
// All email templates are defined here so that business logic never constructs
// HTML strings. Adding a new email type means adding a method here and a
// template below — nothing else needs to change.
package email

import (
	"fmt"

	"github.com/resend/resend-go/v2"
)

// Service wraps the Resend client and provides typed email methods.
type Service struct {
	client    *resend.Client
	fromName  string
	fromAddr  string
	enabled   bool
}

// NewService creates an email service.
// If apiKey is empty the service operates in "dry run" mode: emails are logged
// but not sent. This is the default in development.
func NewService(apiKey, fromName, fromAddr string) *Service {
	svc := &Service{
		fromName: fromName,
		fromAddr: fromAddr,
		enabled:  apiKey != "",
	}
	if apiKey != "" {
		svc.client = resend.NewClient(apiKey)
	}
	return svc
}

// from returns the RFC-5322 formatted sender address.
func (s *Service) from() string {
	return fmt.Sprintf("%s <%s>", s.fromName, s.fromAddr)
}

// send dispatches an email or logs it in dry-run mode.
func (s *Service) send(to, subject, html string) error {
	if !s.enabled {
		fmt.Printf("[EMAIL DRY RUN] To: %s | Subject: %s\n", to, subject)
		return nil
	}

	params := &resend.SendEmailRequest{
		From:    s.from(),
		To:      []string{to},
		Subject: subject,
		Html:    html,
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("sending email via Resend: %w", err)
	}
	return nil
}

// SendAccountActivation sends the initial account setup email to a newly
// created user. The activation link is valid for 72 hours.
func (s *Service) SendAccountActivation(to, fullName, activationURL string) error {
	subject := "Activation de votre compte ISTA-GOMA"
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a56db;">ISTA-GOMA</h1>
    <p style="color: #6b7280;">Plateforme Universitaire</p>
  </div>
  <h2>Bienvenue, %s !</h2>
  <p>Votre compte sur la plateforme ISTA-GOMA a été créé. Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="%s"
       style="background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      Activer mon compte
    </a>
  </div>
  <p style="color: #6b7280; font-size: 14px;">Ce lien est valable pendant <strong>72 heures</strong>. Si vous n'avez pas demandé ce compte, vous pouvez ignorer cet e-mail.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">ISTA-GOMA — Institut Supérieur des Technologies Appliquées de Goma</p>
</body>
</html>`, fullName, activationURL)

	return s.send(to, subject, html)
}

// SendPasswordReset sends a password reset link. The link is valid for 2 hours.
func (s *Service) SendPasswordReset(to, fullName, resetURL string) error {
	subject := "Réinitialisation de votre mot de passe ISTA-GOMA"
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a56db;">ISTA-GOMA</h1>
  </div>
  <h2>Réinitialisation du mot de passe</h2>
  <p>Bonjour %s,</p>
  <p>Nous avons reçu une demande de réinitialisation du mot de passe pour votre compte. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="%s"
       style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      Réinitialiser mon mot de passe
    </a>
  </div>
  <p style="color: #6b7280; font-size: 14px;">Ce lien expire dans <strong>2 heures</strong>. Si vous n'avez pas fait cette demande, ignorez cet e-mail — votre compte est en sécurité.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">ISTA-GOMA — Institut Supérieur des Technologies Appliquées de Goma</p>
</body>
</html>`, fullName, resetURL)

	return s.send(to, subject, html)
}

// SendGradeNotification notifies a student that one of their grades has been modified.
func (s *Service) SendGradeNotification(to, studentName, courseName string, score float64) error {
	subject := fmt.Sprintf("Note mise à jour — %s", courseName)
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2>Mise à jour de note</h2>
  <p>Bonjour %s,</p>
  <p>Votre note pour le cours <strong>%s</strong> a été mise à jour : <strong>%.1f / 20</strong>.</p>
  <p>Connectez-vous à votre portail pour consulter votre relevé complet.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">ISTA-GOMA</p>
</body>
</html>`, studentName, courseName, score)

	return s.send(to, subject, html)
}

// SendAppealResolved notifies a student that their grade appeal has been processed.
func (s *Service) SendAppealResolved(to, studentName, courseName, status, responseText string) error {
	statusLabel := "approuvé"
	if status == "rejected" {
		statusLabel = "rejeté"
	}
	subject := fmt.Sprintf("Votre recours a été %s — %s", statusLabel, courseName)
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2>Résultat de votre recours</h2>
  <p>Bonjour %s,</p>
  <p>Votre recours pour le cours <strong>%s</strong> a été <strong>%s</strong>.</p>
  <p><strong>Réponse du secrétariat :</strong><br>%s</p>
  <p>Connectez-vous à votre portail pour plus de détails.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">ISTA-GOMA</p>
</body>
</html>`, studentName, courseName, statusLabel, responseText)

	return s.send(to, subject, html)
}
