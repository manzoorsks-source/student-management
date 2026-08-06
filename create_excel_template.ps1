# PowerShell Script to Generate Updated School Management System CSV Templates with 10-Month Fees & Exam Terms

$scratchDir = "C:\Users\Manzoor\.gemini\antigravity\scratch\school-management-system"

# 1. 10-Month Fee Management CSV Template
$feesCsv = @"
Student ID,Student Name,Class,Admission Fee (INR),Admission Paid,Exam Fee (INR),Exam Paid,Monthly Fee (INR/mo),Paid Months (Out of 10),Annual Billed Total (INR),Total Paid (INR),Balance Due (INR),Status,Due Date
STD-1001,Aarav Sharma,1st Class-A,5000,Paid,2000,Paid,2400,6 / 10 Months,31000,21400,9600,Pending,2026-08-05
STD-1002,Ananya Patel,1st Class-A,5000,Paid,2000,Pending,2400,3 / 10 Months,31000,12200,18800,Overdue,2026-07-10
STD-1003,Rohan Verma,2nd Class-B,5000,Paid,2000,Paid,2600,10 / 10 Months,33000,33000,0,Paid,2026-09-01
"@

# 2. Assessment Terms & Marks Entry CSV Template
$marksCsv = @"
Student ID,Roll No,Student Name,Class,Exam Assessment Term,Math (100),Science (100),English (100),Social (100),2nd Language (100),Total Marks (500),Percentage (%),Grade,Teacher Remarks
STD-1001,101,Aarav Sharma,1st Class-A,Half-Yearly Exams,92,88,95,86,90,451,90.2%,A+,Excellent student! Consistent performer.
STD-1002,102,Ananya Patel,1st Class-A,1st Assessment,45,42,48,40,44,219,87.6%,A,Good progress in reading.
STD-1003,103,Rohan Verma,2nd Class-B,Quarterly Exams,78,82,80,75,84,399,79.8%,B,Good teamwork and steady improvement.
"@

# Save files
$feesCsv | Out-File -FilePath "$scratchDir\Fee_Payment_Tracker.csv" -Encoding utf8
$marksCsv | Out-File -FilePath "$scratchDir\Academic_Progress_Cards.csv" -Encoding utf8

Write-Host "Updated Fee & Assessment Marks CSV files successfully created in $scratchDir!"
