-- Migration to fix hours_worked column from INT to DECIMAL
-- This fixes the error: invalid input syntax for type integer: "0.1"

-- Change the hours_worked column from integer to decimal with 2 decimal places
ALTER TABLE attendances 
ALTER COLUMN hours_worked TYPE DECIMAL(5,2);

-- This allows values like 8.5, 4.25, etc. instead of only whole numbers like 8, 4

