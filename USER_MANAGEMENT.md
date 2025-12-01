# User Management Guide

## Overview

SchoolYard uses a role-based access control system with three distinct user types. Each user type has specific permissions and access levels designed to match their role in the educational institution.

## User Types

### 1. Admin Users

**Purpose**: System administrators who need full control over all aspects of the school management system.

**What They Can Do**:
- **Full System Access**: Complete control over all features and modules
- **User Management**: Create, edit, and delete user accounts (Admin, Staff, and Parent accounts)
- **Staff Permissions**: Configure granular permissions for staff users
- **Parent-Student Linking**: Link parent accounts to specific students
- **All Modules**: Full access to Students, Teachers, Classes, Payments, Staff, Marketing/Special Classes, and Dashboard
- **Data Management**: Can view, edit, and delete all records across the system

**Who Should Be an Admin**:
- School owners or directors
- IT administrators
- Senior management who need oversight of all operations

**Default Credentials** (for testing):
- Username: `admin`
- Password: `password`

---

### 2. Staff Users

**Purpose**: Employees of the school who need access to specific parts of the system based on their job responsibilities.

**What They Can Do**:
- **Configurable Access**: Permissions are set individually by admins
- **Module-Specific Access**: Can have different levels of access to:
  - Students (View / Edit / Delete)
  - Teachers (View / Edit / Delete)
  - Classes (View / Edit / Delete)
  - Payments (View / Edit / Delete)
  - Staff (View / Edit / Delete)
  - Marketing/Special Classes (View / Edit / Delete)
  - Dashboard (View)
- **Optional Staff Linking**: Can be linked to an existing staff member record
- **No User Management**: Cannot create or manage other users

**Who Should Be Staff**:
- Teachers who need to manage their classes and students
- Receptionists who handle enrollments and payments
- Administrative staff who manage specific modules
- Coordinators who oversee certain departments

**Default Credentials** (for testing):
- Username: `staff1`
- Password: `password`

**Default Permissions for New Staff**:
When a new staff user is created, they receive these default permissions:
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

*Note: Admins can modify these permissions after user creation.*

---

### 3. Parent Users

**Purpose**: Parents or guardians who need to view information about their children's education.

**What They Can Do**:
- **View Student Information**: Read-only access to their linked student(s)
- **Student Profile**: View name, email, phone, date of birth
- **Enrolled Classes**: See which classes their child is enrolled in, including:
  - Class name/subject
  - Teacher name
  - Schedule (days and time)
  - Monthly fees
- **Attendance Records**: View their child's attendance history
- **Tasks and Homework**: See assigned tasks and completion status
- **Payment Status**: View payment history and pending payments
- **Custom Dashboard**: Access to a parent-friendly dashboard at `/parent`

**What They Cannot Do**:
- ❌ Modify any data (read-only access)
- ❌ Access other students' information
- ❌ View system-wide data or reports
- ❌ Access admin or staff features
- ❌ Create or edit records

**Who Should Be a Parent**:
- Parents or guardians of enrolled students
- Family members who need to monitor student progress
- Anyone who needs read-only access to a student's information

**Default Credentials** (for testing):
- Username: `parent1`
- Password: `password`
- Linked to: Omar Benali (first student in the system)

---

## How Parents Fit Into the System

### Parent-Student Relationship

Parents are linked to students through a **one-to-many relationship**:
- One parent account can be linked to **multiple students** (e.g., a parent with multiple children)
- Each parent account has a `studentIds` array that contains the IDs of students they can access
- When a parent logs in, they only see information for students in their `studentIds` array

### Linking Process

**Step 1: Create the Parent Account**
1. Admin logs in and navigates to **User Management** (`/admin/users`)
2. Clicks **"Add User"**
3. Fills in parent information:
   - Username and password
   - Full name
   - Email
   - Phone (optional)
   - **Role: Parent**

**Step 2: Link Students**
1. In the "Linked Students" section, admin sees a list of all students
2. Admin checks the boxes next to the students this parent should have access to
3. Admin can select multiple students (for parents with multiple children)
4. At least one student must be selected (required)

**Step 3: Save**
1. Click "Create User"
2. Parent account is created and linked to selected students
3. Parent can now log in and view their children's information

### What Parents See

When a parent logs in, they are automatically redirected to the **Parent Dashboard** (`/parent`), which shows:

1. **Welcome Message**: Personalized greeting with parent's name
2. **Student Cards**: One card for each linked student, showing:
   - **Student Profile**: Name, email, phone, date of birth
   - **Enrolled Classes**: List of classes with teacher, schedule, and fees
   - **Attendance**: Recent attendance records (last 10)
   - **Assigned Tasks**: All tasks with due dates and completion status
   - **Payment Status**: 
     - Paid payments count and total
     - Pending payments count and total
     - Details of pending payments

### Example Scenarios

**Scenario 1: Single Child**
- Parent account: `fatima.benali`
- Linked to: `Omar Benali` (one student)
- Parent sees: Only Omar's information

**Scenario 2: Multiple Children**
- Parent account: `ahmed.family`
- Linked to: `Student A`, `Student B`, `Student C` (three students)
- Parent sees: Three separate cards, one for each child

**Scenario 3: Divorced Parents**
- Parent account 1: `mother.smith`
- Linked to: `John Smith`
- Parent account 2: `father.smith`
- Linked to: `John Smith` (same student)
- Both parents can view the same student's information independently

---

## Creating and Managing Users

### Creating a New User (Admin Only)

1. **Navigate to User Management**
   - Login as admin
   - Click "User Management" in the sidebar
   - Or go to `/admin/users`

2. **Click "Add User"**
   - Button is located at the top of the user list

3. **Fill in Account Information**
   - Username (must be unique, minimum 3 characters)
   - Password (minimum 6 characters)

4. **Fill in Personal Information**
   - Full Name
   - Email (must be valid format)
   - Phone (optional)
   - **Role**: Select Admin, Staff, or Parent

5. **Role-Specific Configuration**

   **For Staff Users**:
   - Optionally link to an existing staff member record
   - Default permissions are automatically assigned
   - Permissions can be customized after creation

   **For Parent Users**:
   - **Required**: Select at least one student to link
   - Check boxes next to students this parent should access
   - Can select multiple students

6. **Create User**
   - Click "Create User" button
   - User is created and appears in the user list

### Editing a User (Admin Only)

1. Navigate to User Management
2. Find the user in the list
3. Click the "Edit" button (pencil icon)
4. Modify any information:
   - Account details (username, password)
   - Personal information
   - For Staff: Change permissions
   - For Parent: Add or remove linked students
5. Click "Save Changes"

### Configuring Staff Permissions (Admin Only)

1. Navigate to User Management
2. Find the staff user
3. Click the "Manage Permissions" button (lock icon)
4. Toggle permissions as needed:
   - Each module has three levels: View, Edit, Delete
   - Enable/disable specific permissions
5. Click "Save Permissions"
6. Changes take effect immediately

### Deleting a User (Admin Only)

1. Navigate to User Management
2. Find the user
3. Click the "Delete" button (trash icon)
4. Confirm deletion
5. **Note**: Admins cannot delete themselves

---

## Navigation and Access Control

### Sidebar Navigation

The sidebar automatically adjusts based on user role:

- **Admin**: Sees all menu items + "User Management"
- **Staff**: Sees only menu items for modules they have "View" permission for
- **Parent**: Sees only "My Students" link (redirects to `/parent`)

### Route Protection

All routes are automatically protected:
- **Unauthenticated users**: Redirected to login page
- **Users without permission**: Redirected to dashboard with error message
- **Parent users**: Automatically redirected to `/parent` dashboard
- **Permission checks**: Happen at both route level and UI element level

### Access Examples

**Example 1: Staff with Limited Permissions**
- Staff user has: View Students, Edit Students, View Classes
- Can access: Students list, Student detail pages, Classes list
- Cannot access: Teachers, Payments, Marketing, User Management
- Sidebar shows: Dashboard, Students, Classes (only)

**Example 2: Parent User**
- Parent user logs in
- Automatically redirected to `/parent`
- Sidebar shows: Only "My Students"
- Trying to access `/students` redirects to `/parent`
- Can only view their linked students' information

---

## Best Practices

### For Admins

1. **Create Staff Accounts Carefully**
   - Only grant permissions that staff members actually need
   - Follow the principle of least privilege
   - Review permissions periodically

2. **Link Parents Correctly**
   - Always verify student selection when creating parent accounts
   - Ensure parents are linked to the correct students
   - Update links if students are transferred or removed

3. **Regular Audits**
   - Periodically review user accounts
   - Remove inactive accounts
   - Update permissions as roles change

### For Staff

1. **Understand Your Permissions**
   - Check with admin if you need access to additional modules
   - Don't attempt to access restricted areas

2. **Report Issues**
   - Contact admin if you can't access something you need
   - Report any security concerns immediately

### For Parents

1. **Keep Credentials Secure**
   - Don't share your login credentials
   - Contact admin if you need to reset your password

2. **Check Regularly**
   - Log in regularly to check attendance and tasks
   - Monitor payment status
   - Review class schedules

---

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
- Regular security updates

---

## Troubleshooting

### Parent Cannot See Student

**Problem**: Parent logs in but sees "No students assigned to your account"

**Solution**:
1. Admin should check User Management
2. Edit the parent user
3. Verify students are selected in "Linked Students"
4. Save changes

### Staff Cannot Access Module

**Problem**: Staff user cannot see a module in sidebar or gets "Access denied"

**Solution**:
1. Admin should check user permissions
2. Navigate to User Management
3. Click "Manage Permissions" for the staff user
4. Enable "View" permission for the required module
5. Save permissions

### User Cannot Log In

**Problem**: User gets "Invalid credentials" error

**Solution**:
1. Verify username and password are correct
2. Check for typos
3. Admin can reset password by editing the user account

---

## Summary

SchoolYard's user management system provides three distinct user types:

- **Admin**: Full system control and user management
- **Staff**: Configurable permissions based on job role
- **Parent**: Read-only access to linked students' information

Parents are seamlessly integrated into the system through a simple linking process where admins connect parent accounts to specific students. This allows parents to monitor their children's progress, attendance, tasks, and payments while maintaining data security and privacy.

For technical implementation details, see `RBAC_DOCUMENTATION.md`.

