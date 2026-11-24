# Site Administration

## Overview
Guidelines for managing and administering the site, including user management, content management, and system configuration.

## Key Areas
- **User Management**: Roles, permissions, authentication
- **Content Management**: Pages, dynamic data tables, themes
- **System Configuration**: Settings, integrations, monitoring
- **Security**: Access control, audit logs, data protection

## Dynamic Data Table Management
- Tables defined in `readOnlyTables.js` for access control
- Backend enforcement via `assertWritable` in controllers
- Frontend routing with `useParams` for table names

## Theme Management
- Admin interface for theme customization
- Theme data stored and applied site-wide
- Preview before publishing

## Best Practices
- Always validate permissions server-side
- Keep configuration in version control
- Log administrative actions for audit trail