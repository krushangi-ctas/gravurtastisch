/**
 * Utility to convert any API response message into bilingual format:
 * German in front, followed by current English in parentheses:
 * "<German Message> (<English Message>)"
 */

const exactMap: Record<string, string> = {
  // General / Status
  'Success': 'Erfolg',
  'Created': 'Erstellt',
  ' Created.': 'Erstellt',
  'Updated successfully': 'Erfolgreich aktualisiert',
  'Updated successfully.': 'Erfolgreich aktualisiert',
  'Data inserted successfully': 'Daten erfolgreich eingefügt',
  'Something Went Wrong.': 'Etwas ist schiefgelaufen',
  'Something went wrong!': 'Etwas ist schiefgelaufen!',
  'Something went wrong..': 'Etwas ist schiefgelaufen',
  'Something want wrong, Please try again': 'Etwas ist schiefgelaufen, bitte versuchen Sie es erneut',
  'An unexpected error occurred.': 'Ein unerwarteter Fehler ist aufgetreten',
  'Unexpected error': 'Unerwarteter Fehler',
  'Please authenticate': 'Bitte authentifizieren Sie sich',
  'Unauthorized: User not authenticated': 'Nicht autorisiert: Benutzer nicht authentifiziert',
  'Token expired': 'Token abgelaufen',
  'Forbidden': 'Zugriff verweigert',
  'You do not have permission to perform this action.': 'Sie haben keine Berechtigung, diese Aktion auszuführen',
  'Changes reverted to saved state.': 'Änderungen auf gespeicherten Zustand zurückgesetzt',
  'Please fix the highlighted errors before saving.': 'Bitte beheben Sie die markierten Fehler vor dem Speichern',
  'Please correct the highlighted errors in the form': 'Bitte korrigieren Sie die markierten Fehler im Formular',
  'Wrong Information': 'Falsche Angaben',
  'File not found!': 'Datei nicht gefunden!',
  'File not found': 'Datei nicht gefunden',
  'File processed successfully!': 'Datei erfolgreich verarbeitet!',
  'No file provided.': 'Keine Datei bereitgestellt',
  'Image file is required': 'Bilddatei ist erforderlich',
  'Image uploaded successfully.': 'Bild erfolgreich hochgeladen',
  'Screenshot uploaded successfully': 'Screenshot erfolgreich hochgeladen',
  'Screenshot uploaded successfully.': 'Screenshot erfolgreich hochgeladen',
  'Screenshot file is required': 'Screenshot-Datei ist erforderlich',
  'Title is required': 'Titel ist erforderlich',
  'Title is required.': 'Titel ist erforderlich',

  // Auth & Account
  'Login successful.': 'Anmeldung erfolgreich',
  'Successfully logged in!': 'Erfolgreich angemeldet!',
  'Successfully logged in with Universal OTP!': 'Erfolgreich mit Universal-OTP angemeldet!',
  'OTP sent to your email.': 'OTP an Ihre E-Mail gesendet',
  'Verification code sent to your email.': 'Bestätigungscode an Ihre E-Mail gesendet',
  'New verification code sent!': 'Neuer Bestätigungscode gesendet!',
  'Failed to send OTP.': 'OTP konnte nicht gesendet werden',
  'Failed to resend OTP.': 'OTP konnte nicht erneut gesendet werden',
  'Failed to send OTP. Please try again.': 'OTP konnte nicht gesendet werden. Bitte versuchen Sie es erneut',
  'Failed to resend OTP. Please try again.': 'OTP konnte nicht erneut gesendet werden. Bitte versuchen Sie es erneut',
  'Invalid or expired OTP.': 'Ungültiges oder abgelaufenes OTP',
  'Password updated successfully': 'Passwort erfolgreich aktualisiert',
  'Password reset successfully': 'Passwort erfolgreich zurückgesetzt',
  'Failed to change password.': 'Passwort konnte nicht geändert werden',
  'Current password invalid!': 'Aktuelles Passwort ist ungültig!',
  'Current password is incorrect': 'Aktuelles Passwort ist falsch',
  'Current password is required': 'Aktuelles Passwort ist erforderlich',
  'New password must be at least 8 characters long': 'Neues Passwort muss mindestens 8 Zeichen lang sein',
  'New password and confirm password do not match': 'Neues Passwort und Passwort-Bestätigung stimmen nicht überein',
  'User created': 'Benutzer erstellt',
  'User created successfully.': 'Benutzer erfolgreich erstellt',
  'User updated successfully.': 'Benutzer erfolgreich aktualisiert',
  'User deleted successfully.': 'Benutzer erfolgreich gelöscht',
  'User not found': 'Benutzer nicht gefunden',
  'User not found!': 'Benutzer nicht gefunden!',
  'User list.': 'Benutzerliste',
  'get user successfully': 'Benutzer erfolgreich abgerufen',
  'get all user successfully': 'Alle Benutzer erfolgreich abgerufen',
  'Team users fetched': 'Team-Benutzer abgerufen',
  'Email already exists': 'E-Mail existiert bereits',
  'Invalid user ID format': 'Ungültiges Benutzer-ID-Format',
  'Error while updating user': 'Fehler beim Aktualisieren des Benutzers',
  'Error while updating user.': 'Fehler beim Aktualisieren des Benutzers',
  'Error while delete user': 'Fehler beim Löschen des Benutzers',
  'Seller registered successfully.': 'Verkäufer erfolgreich registriert',
  'Seller / User not found.': 'Verkäufer / Benutzer nicht gefunden',
  'No seller selected': 'Kein Verkäufer ausgewählt',
  'Super admin accounts cannot be modified via API': 'Super-Admin-Konten können nicht über die API geändert werden',
  'You do not have permission to modify this user.': 'Sie haben keine Berechtigung, diesen Benutzer zu bearbeiten',
  'Profile picture has been uploaded.': 'Profilbild wurde hochgeladen',
  'Profile picture has been removed.': 'Profilbild wurde entfernt',
  'Failed to update user profile image': 'Profilbild konnte nicht aktualisiert werden',
  'User settings saved successfully.': 'Benutzereinstellungen erfolgreich gespeichert',

  // Roles & Permissions
  'Role created': 'Rolle erstellt',
  'Role created successfully.': 'Rolle erfolgreich erstellt',
  'Role created successfully': 'Rolle erfolgreich erstellt',
  'Role updated': 'Rolle aktualisiert',
  'Role updated successfully.': 'Rolle erfolgreich aktualisiert',
  'Role updated successfully': 'Rolle erfolgreich aktualisiert',
  'Role deleted': 'Rolle gelöscht',
  'Role deleted successfully.': 'Rolle erfolgreich gelöscht',
  'Role deleted successfully': 'Rolle erfolgreich gelöscht',
  'Role not found': 'Rolle nicht gefunden',
  'Role fetched': 'Rolle abgerufen',
  'Roles fetched': 'Rollen abgerufen',
  'Role name already exists': 'Rollenname existiert bereits',
  'role_id is required': 'Rollen-ID ist erforderlich',
  'Invalid role': 'Ungültige Rolle',
  'Role must be an admin role': 'Rolle muss eine Admin-Rolle sein',
  'System roles cannot be modified': 'Systemrollen können nicht geändert werden',
  'System roles cannot be deleted': 'Systemrollen können nicht gelöscht werden',
  'Role is assigned to users. Reassign users before deleting.': 'Rolle ist Benutzern zugewiesen. Bitte weisen Sie Benutzer vor dem Löschen neu zu',
  'Sections fetched': 'Bereiche abgerufen',
  'Section created successfully.': 'Bereich erfolgreich erstellt',
  'Section created successfully': 'Bereich erfolgreich erstellt',
  'Section updated successfully.': 'Bereich erfolgreich aktualisiert',
  'Section updated successfully': 'Bereich erfolgreich aktualisiert',
  'Section deleted successfully.': 'Bereich erfolgreich gelöscht',
  'Section deleted successfully': 'Bereich erfolgreich gelöscht',
  'Section not found.': 'Bereich nicht gefunden',
  'Section not found': 'Bereich nicht gefunden',
  'You do not have permission to create roles for this scope': 'Sie haben keine Berechtigung, Rollen für diesen Bereich zu erstellen',
  'You do not have permission to view this role': 'Sie haben keine Berechtigung, diese Rolle anzuzeigen',
  'You do not have permission to modify this role': 'Sie haben keine Berechtigung, diese Rolle zu bearbeiten',
  'You do not have permission to delete this role': 'Sie haben keine Berechtigung, diese Rolle zu löschen',

  // Plans & Subscriptions
  'Plan created successfully.': 'Plan erfolgreich erstellt',
  'Plan created successfully': 'Plan erfolgreich erstellt',
  'Plan updated successfully.': 'Plan erfolgreich aktualisiert',
  'Plan updated successfully': 'Plan erfolgreich aktualisiert',
  'Plan deleted successfully.': 'Plan erfolgreich gelöscht',
  'Plan deleted successfully': 'Plan erfolgreich gelöscht',
  'Plan not found.': 'Plan nicht gefunden',
  'Plan not found': 'Plan nicht gefunden',
  'Plans retrieved successfully.': 'Pläne erfolgreich abgerufen',
  'Plan details retrieved successfully.': 'Plandetails erfolgreich abgerufen',
  'Plan ID is required.': 'Plan-ID ist erforderlich',
  'Plan ID is required': 'Plan-ID ist erforderlich',
  'Selected plan not found or inactive.': 'Ausgewählter Plan nicht gefunden oder inaktiv',
  'Selected plan was not found or is no longer active.': 'Ausgewählter Plan wurde nicht gefunden oder ist nicht mehr aktiv',
  'Please select a plan to assign': 'Bitte wählen Sie einen zuzuweisenden Plan aus',
  'Plan assigned successfully': 'Plan erfolgreich zugewiesen',
  'Plan assigned successfully.': 'Plan erfolgreich zugewiesen',
  'Failed to assign plan': 'Plan konnte nicht zugewiesen werden',
  'Your subscription plan has expired. Please renew or upgrade your plan to activate marketplaces.': 'Ihr Abonnementplan ist abgelaufen. Bitte erneuern oder upgraden Sie Ihren Plan, um Marktplätze zu aktivieren',
  'Your subscription plan has been cancelled. Please subscribe to an active plan to configure or activate marketplaces.': 'Ihr Abonnementplan wurde gekündigt. Bitte abonnieren Sie einen aktiven Plan, um Marktplätze zu konfigurieren oder zu aktivieren',
  'Your subscription plan has expired. Please renew or upgrade your plan to manage Amazon credentials and marketplaces.': 'Ihr Abonnementplan ist abgelaufen. Bitte erneuern oder upgraden Sie Ihren Plan, um Amazon-Zugangsdaten und Marktplätze zu verwalten',
  'Your subscription plan has been cancelled. Please subscribe to an active plan to manage Amazon credentials and marketplaces.': 'Ihr Abonnementplan wurde gekündigt. Bitte abonnieren Sie einen aktiven Plan, um Amazon-Zugangsdaten und Marktplätze zu verwalten',

  // Amazon & Marketplaces
  'Amazon credentials retrieved successfully': 'Amazon-Zugangsdaten erfolgreich abgerufen',
  'Amazon credentials updated successfully': 'Amazon-Zugangsdaten erfolgreich aktualisiert',
  'Marketplaces fetched successfully': 'Marktplätze erfolgreich abgerufen',
  'Failed to fetch marketplaces': 'Marktplätze konnten nicht abgerufen werden',
  'Orders fetched successfully': 'Bestellungen erfolgreich abgerufen',
  'Failed to fetch order list.': 'Bestellliste konnte nicht abgerufen werden',
  'No matching orders found.': 'Keine passenden Bestellungen gefunden',

  // Guide Documents & Steps
  'Guide module created successfully.': 'Leitfaden-Modul erfolgreich erstellt',
  'Guide module updated successfully.': 'Leitfaden-Modul erfolgreich aktualisiert',
  'Guide module deleted successfully.': 'Leitfaden-Modul erfolgreich gelöscht',
  'Module not found': 'Modul nicht gefunden',
  'Module title is required': 'Modultitel ist erforderlich',
  'Modules order updated successfully.': 'Modulreihenfolge erfolgreich aktualisiert',
  'Step created successfully.': 'Schritt erfolgreich erstellt',
  'Step added successfully.': 'Schritt erfolgreich hinzugefügt',
  'Step updated successfully.': 'Schritt erfolgreich aktualisiert',
  'Step deleted successfully.': 'Schritt erfolgreich gelöscht',
  'Step not found': 'Schritt nicht gefunden',
  'Step order updated successfully.': 'Schrittreihenfolge erfolgreich aktualisiert',
  'A module with this title already exists in this section': 'Ein Modul mit diesem Titel existiert bereits in diesem Bereich',
  'Parent module not found or unpublished': 'Hauptkategorie nicht gefunden oder deaktiviert',
  'Steps can only be added to child modules': 'Schritte können nur zu Untermodulen hinzugefügt werden',

  // Blogs
  'Blog created successfully.': 'Blog erfolgreich erstellt',
  'Blog created successfully': 'Blog erfolgreich erstellt',
  'Blog updated successfully.': 'Blog erfolgreich aktualisiert',
  'Blog updated successfully': 'Blog aktualisiert',
  'Blog published successfully.': 'Blog erfolgreich veröffentlicht',
  'Blog not found.': 'Blog nicht gefunden',
  'Blog not found': 'Blog nicht gefunden',
  'Blogs retrieved successfully.': 'Blogs erfolgreich abgerufen',
  'Blog details retrieved successfully.': 'Blogdetails erfolgreich abgerufen',

  // Support & Logs & Settings
  'Support request created successfully': 'Support-Anfrage erfolgreich erstellt',
  'Support request updated successfully': 'Support-Anfrage erfolgreich aktualisiert',
  'Support request not found': 'Support-Anfrage nicht gefunden',
  'System logs retrieved successfully': 'Systemprotokolle erfolgreich abgerufen',
  'Status updated successfully': 'Status erfolgreich aktualisiert',
  'Failed to fetch general settings.': 'Allgemeine Einstellungen konnten nicht abgerufen werden',
  'Failed to update or insert general settings.': 'Allgemeine Einstellungen konnten nicht gespeichert werden',
  'Website configuration retrieved successfully.': 'Website-Konfiguration erfolgreich abgerufen',
  'Website configuration updated successfully.': 'Website-Konfiguration erfolgreich aktualisiert'
};

const entityTranslations: Record<string, string> = {
  user: 'Benutzer',
  users: 'Benutzer',
  role: 'Rolle',
  roles: 'Rollen',
  section: 'Bereich',
  sections: 'Bereiche',
  plan: 'Plan',
  plans: 'Pläne',
  blog: 'Blog',
  blogs: 'Blogs',
  guide: 'Leitfaden',
  module: 'Modul',
  modules: 'Module',
  step: 'Schritt',
  steps: 'Schritte',
  order: 'Bestellung',
  orders: 'Bestellungen',
  marketplace: 'Marktplatz',
  marketplaces: 'Marktplätze',
  support: 'Support',
  ticket: 'Ticket',
  email: 'E-Mail',
  password: 'Passwort',
  image: 'Bild',
  screenshot: 'Screenshot',
  status: 'Status',
  setting: 'Einstellung',
  settings: 'Einstellungen'
};

function translateEntity(raw: string): string {
  const lower = raw.trim().toLowerCase();
  return entityTranslations[lower] || raw;
}

/**
 * Returns formatted string: "<German Message> (<English Message>)"
 */
export function toBilingualMessage(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) {
    return typeof raw === 'string' ? raw : '';
  }

  const trimmed = raw.trim();
  if (!trimmed) return raw;

  // Preserve machine codes or short IDs (e.g. "already_running", "cancelling", "started")
  if (/^[a-z0-9_-]+$/.test(trimmed) && trimmed.includes('_')) {
    return raw;
  }

  // Already bilingual if it has the format "Something (Something)"
  if (/^[^\(\)]+\s*\([^\(\)]+\)$/.test(trimmed)) {
    return raw;
  }

  // 1. Direct exact match
  if (exactMap[trimmed]) {
    return `${exactMap[trimmed]} (${trimmed})`;
  }

  // Also test without trailing punctuation
  const stripped = trimmed.replace(/[\.\!\?]+$/, '');
  if (exactMap[stripped]) {
    return `${exactMap[stripped]} (${trimmed})`;
  }

  // 2. Pattern: "X created successfully"
  let match = trimmed.match(/^([a-zA-Z\s_-]+)\s+created(?:\s+successfully)?[\.\!]?$/i);
  if (match) {
    const german = translateEntity(match[1]);
    return `${german} erfolgreich erstellt (${trimmed})`;
  }

  // 3. Pattern: "X updated successfully"
  match = trimmed.match(/^([a-zA-Z\s_-]+)\s+updated(?:\s+successfully)?[\.\!]?$/i);
  if (match) {
    const german = translateEntity(match[1]);
    return `${german} erfolgreich aktualisiert (${trimmed})`;
  }

  // 4. Pattern: "X deleted successfully"
  match = trimmed.match(/^([a-zA-Z\s_-]+)\s+deleted(?:\s+successfully)?[\.\!]?$/i);
  if (match) {
    const german = translateEntity(match[1]);
    return `${german} erfolgreich gelöscht (${trimmed})`;
  }

  // 5. Pattern: "X not found"
  match = trimmed.match(/^([a-zA-Z\s_-]+)\s+not\s+found[\.\!]?$/i);
  if (match) {
    const german = translateEntity(match[1]);
    return `${german} nicht gefunden (${trimmed})`;
  }

  // 6. Pattern: "X already exists"
  match = trimmed.match(/^([a-zA-Z\s_-]+)\s+already\s+exists[\.\!]?$/i);
  if (match) {
    const german = translateEntity(match[1]);
    return `${german} existiert bereits (${trimmed})`;
  }

  // 7. Pattern: "X is required"
  match = trimmed.match(/^([a-zA-Z\s_-]+)\s+is\s+required[\.\!]?$/i);
  if (match) {
    const german = translateEntity(match[1]);
    return `${german} ist erforderlich (${trimmed})`;
  }

  // 8. Pattern: "X fetched successfully" or "X retrieved successfully"
  match = trimmed.match(/^([a-zA-Z\s_-]+)\s+(?:fetched|retrieved)(?:\s+successfully)?[\.\!]?$/i);
  if (match) {
    const german = translateEntity(match[1]);
    return `${german} erfolgreich abgerufen (${trimmed})`;
  }

  // 9. Pattern: "Missing permission: X"
  match = trimmed.match(/^missing\s+permission:\s*(.+)$/i);
  if (match) {
    return `Fehlende Berechtigung: ${match[1].trim()} (${trimmed})`;
  }

  // 10. Pattern: "You do not have permission to X"
  match = trimmed.match(/^you\s+do\s+not\s+have\s+permission\s+to\s+(.+)$/i);
  if (match) {
    return `Sie haben keine Berechtigung, diese Aktion auszuführen (${trimmed})`;
  }

  // Default: if no rule matched, preserve original English message
  return trimmed;
}

module.exports = {
  toBilingualMessage
};
