# Role-Based Access Control (RBAC) System

## Overview

SchoolYard now features a comprehensive role-based access control system with three distinct user types, each with specific permissions and access levels.

## User Roles

### 1. Admin
**Full System Access**
- Complete control over all system features
- Can manage all users, staff, students, teachers, classes, payments, and marketing
- Access to User Management panel to create and configure other users
- Can assign and modify permissions for staff users
- Can create parent accounts and link them to students

**Default Credentials:**
- Username: `admin`
- Password: `password`

### 2. Staff
**Limited Permissions (Configurable)**
- Permissions are configured by admins on a per-user basis
- Can have different levels of access to various system modules
- Cannot access User Management
- Ideal for teachers, receptionists, or other staff members

**Default Credentials:**
- Username: `staff1`
- Password: `password`

**Configurable Permissions:**
- **Students**: View / Edit / Delete
- **Teachers**: View / Edit / Delete
- **Classes**: View / Edit / Delete
- **Payments**: View / Edit / Delete
- **Staff**: View / Edit / Delete
- **Marketing**: View / Edit / Delete
- **Dashboard**: View

### 3. Parent
**Student Information Only**
- Can only view information about their linked student(s)
- Read-only access to:
  - Student profile information
  - Enrolled classes and schedules
  - Teachers information
  - Attendance records
  - Assigned tasks and homework
  - Payment status
- Cannot modify any data
- Custom dashboard with child-friendly information display

**Default Credentials:**
- Username: `parent1`
- Password: `password`
- Linked to: Omar Benali (first student)

## Features

### User Management (Admin Only)
Located at `/admin/users`, this panel allows admins to:
- View all system users
- Create new users (Admin, Staff, or Parent)
- Edit existing users
- Delete users (except self)
- Configure staff permissions
- Link parents to students

### Permission System
The staff permission system is granular and flexible:
- Each permission module has view, edit, and delete capabilities
- Admins can create custom permission profiles for different roles
- Permissions are stored per-user and can be updated at any time
- Staff members automatically see only the navigation items they have access to

### Route Protection
All routes are automatically protected:
- Unauthenticated users are redirected to login
- Users without proper permissions are redirected to dashboard
- Parents are automatically redirected to their custom dashboard
- Permission checks happen both at route level and UI element level

### Navigation
The sidebar dynamically adjusts based on user role:
- **Admin**: Sees all menu items + User Management
- **Staff**: Sees only items they have view permission for
- **Parent**: Sees only "My Students" link

## Technical Implementation

### Key Files
- `lib/auth.tsx` - Authentication context with role checking
- `lib/data.ts` - User types and permission definitions
- `lib/store.tsx` - User management functions
- `lib/permissions.tsx` - Permission checking hooks
- `components/ProtectedRoute.tsx` - Route protection component
- `components/Sidebar.tsx` - Role-based navigation
- `app/admin/users/page.tsx` - User management interface
- `app/parent/page.tsx` - Parent dashboard

### Permission Checking
```typescript
// In any component
const { hasPermission, isAdmin, isStaff, isParent } = useAuth();

// Check specific permission
if (hasPermission("editStudents")) {
  // Show edit button
}

// Check role
if (isAdmin()) {
  // Show admin-only content
}
```

### Route Protection
```typescript
// Protect entire page
useEffect(() => {
  if (!hasPermission("viewStudents")) {
    router.push("/dashboard");
  }
}, [hasPermission, router]);
```

## Usage Examples

### Creating a New Staff User
1. Login as admin
2. Navigate to User Management (sidebar)
3. Click "Add User"
4. Fill in user details and select "Staff" role
5. Optionally link to an existing staff member
6. Click "Create User"
7. Click the lock icon to configure permissions
8. Enable/disable specific permissions
9. Click "Save Permissions"

### Creating a Parent Account
1. Login as admin
2. Navigate to User Management
3. Click "Add User"
4. Fill in user details and select "Parent" role
5. Check the students this parent should have access to
6. Click "Create User"

### Modifying Staff Permissions
1. Login as admin
2. Navigate to User Management
3. Find the staff user
4. Click the lock icon (Manage Permissions)
5. Toggle permissions as needed
6. Click "Save Permissions"

## Security Notes

⚠️ **Important**: This is a demo implementation. In a production environment:
- Passwords should be hashed (use bcrypt or similar)
- Implement proper session management
- Add CSRF protection
- Use HTTPS
- Implement rate limiting
- Add audit logging
- Consider using JWT tokens
- Implement password complexity requirements
- Add password reset functionality
- Use environment variables for secrets

## Default Permissions for New Staff

When creating a new staff user, they receive these default permissions:
- ✅ View Students
- ✅ Edit Students
- ❌ Delete Students
- ✅ View Teachers
- ❌ Edit Teachers
- ❌ Delete Teachers
- ✅ View Classes
- ✅ Edit Classes
- ❌ Delete Classes
- ✅ View Payments
- ✅ Edit Payments
- ❌ Delete Payments
- ✅ View Staff
- ❌ Edit Staff
- ❌ Delete Staff
- ✅ View Marketing
- ❌ Edit Marketing
- ❌ Delete Marketing
- ✅ View Dashboard

These can be customized after user creation.

## Testing the System

### Test as Admin
1. Login with `admin` / `password`
2. Access all features
3. Create new users
4. Modify permissions

### Test as Staff
1. Login with `staff1` / `password`
2. Notice limited navigation options
3. Try accessing restricted features (should redirect)
4. Test editing students (allowed by default)
5. Try deleting students (should be hidden/disabled)

### Test as Parent
1. Login with `parent1` / `password`
2. View student information (Omar Benali)
3. Notice read-only access
4. Try accessing `/students` (should redirect to `/parent`)

## Future Enhancements

Potential improvements to the RBAC system:
- [ ] Multi-parent support (multiple parents per student)
- [ ] Time-based permissions (temporary access)
- [ ] Permission templates/roles
- [ ] Activity logging and audit trails
- [ ] Two-factor authentication
- [ ] Password expiry and rotation
- [ ] IP-based access restrictions
- [ ] More granular permissions (per-class, per-student)
- [ ] Parent-teacher messaging
- [ ] Parent notifications for attendance/grades

