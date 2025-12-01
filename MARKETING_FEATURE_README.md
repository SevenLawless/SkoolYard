# Marketing Section - Feature Documentation

## Overview
The Marketing section is a specialized module for managing unique marketing classes with custom profit-sharing agreements, detailed expense tracking, and comprehensive financial reporting.

## Key Features

### 1. **Marketing Classes Management**
- Create specialized marketing classes separate from regular classes
- Each class has detailed descriptions and custom configurations
- Can be activated/deactivated as needed
- Full CRUD operations (Create, Read, Update, Delete)

### 2. **Student & Teacher Assignment**
- Add multiple teachers to a single marketing class
- Enroll students with custom fee structures
- Easy management of class participants
- Remove students/teachers as needed

### 3. **Financial Tracking**
- **Revenue Tracking**: Automatic calculation of total revenue from enrolled students
- **Expense Management**: Track all money going out (expenses)
- **Income Management**: Track additional money coming in (sponsorships, deals, etc.)
- **Net Income**: Real-time calculation of profit after all expenses

### 4. **Profit Sharing**
- Configurable profit-sharing percentage between center and teachers
- Visual representation of profit distribution
- Automatic calculation of individual teacher shares when multiple teachers are assigned
- Adjustable percentages using an intuitive slider interface

### 5. **Expense Tracking**
- Add expenses with categories:
  - Advertising
  - Materials
  - Venue
  - Equipment
  - Salaries
  - Utilities
  - Sponsorship
  - Partnership Deal
  - Other Income
  - Other Expense
- Track both money in and money out
- Date, amount, category, and description for each transaction
- Delete expenses as needed
- Visual distinction between income (green) and expenses (red)

### 6. **Comprehensive Dashboard**
- Overview statistics showing:
  - Total number of marketing classes
  - Total revenue across all classes
  - Total student count
- Individual class cards with quick stats
- Search functionality to find classes easily
- Pagination for large class lists

### 7. **Detailed Class View**
Each marketing class has its own detail page showing:
- Financial overview cards (Revenue, Money In, Money Out, Net Income)
- Profit distribution visualization
- Complete list of teachers with individual profit shares
- Complete list of enrolled students
- Full expense history with filtering
- Quick actions for all operations

## Navigation
Access the Marketing section from the sidebar menu. The Marketing icon appears after Payments in the navigation.

## Use Cases

### Use Case 1: Special Partnership Class
Create a marketing class for a special deal with a learning center that doesn't follow standard pricing:
1. Create the class with custom fees and profit-sharing
2. Add the teachers involved in the partnership
3. Track the special deal income as "Money In"
4. Track all related expenses
5. Monitor the profit distribution automatically

### Use Case 2: Sponsored Bootcamp
Run a sponsored bootcamp with external funding:
1. Create the marketing class
2. Add sponsorship money as "Money In" transaction
3. Track advertising and material costs as expenses
4. Enroll students and track their fees
5. View net profit after all expenses and how it's split

### Use Case 3: Multi-Teacher Special Course
Organize a special course with multiple expert teachers:
1. Create the class with appropriate profit-sharing percentage
2. Add all teachers to the class
3. System automatically calculates each teacher's share
4. Track all course-related expenses
5. Monitor overall profitability

## Data Structure

### MarketingClass
```typescript
{
  id: string;
  name: string;
  description: string;
  teacherIds: string[];
  studentIds: string[];
  fees: number;
  profitSharingPercentage: number;
  centerPercentage: number;
  schedule: { date: string; time: string }[];
  daysOfWeek?: number[];
  time?: string;
  expenses: MarketingExpense[];
  createdAt: string;
  active: boolean;
}
```

### MarketingExpense
```typescript
{
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  type: "in" | "out";
}
```

## Financial Calculations

### Total Revenue
```
Total Revenue = Fees per Student × Number of Students
```

### Money In
```
Money In = Sum of all expenses with type "in"
```

### Money Out
```
Money Out = Sum of all expenses with type "out"
```

### Net Income
```
Net Income = Total Revenue + Money In - Money Out
```

### Profit Distribution
```
Center Share = Net Income × (Center Percentage / 100)
Teacher Share = Net Income × (Profit Sharing Percentage / 100)
Share per Teacher = Teacher Share / Number of Teachers
```

## Benefits

1. **Flexibility**: Handle special deals and partnerships that don't fit standard class structures
2. **Transparency**: Clear financial tracking for all stakeholders
3. **Accuracy**: Automatic calculations eliminate manual errors
4. **Insights**: Quick overview of profitability and performance
5. **Scalability**: Manage unlimited marketing classes with ease
6. **Customization**: Each class can have unique profit-sharing agreements

## Best Practices

1. **Detailed Descriptions**: Always add comprehensive descriptions to marketing classes
2. **Regular Updates**: Keep expense records up-to-date for accurate financial reporting
3. **Category Consistency**: Use consistent categories for expenses to make tracking easier
4. **Document Transactions**: Add detailed descriptions to all financial transactions
5. **Review Regularly**: Check the financial overview regularly to monitor class performance

## Future Enhancements (Suggestions)
- Export financial reports to PDF/Excel
- Set budget limits and get alerts when exceeded
- Compare performance across multiple marketing classes
- Add payment installment tracking for students
- Integration with accounting software
- Analytics dashboard with charts and trends

