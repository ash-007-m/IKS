from  import date

# Create a Georgian date
georgian_date = date.Date(1980, 1, 21)  # Replace with your desired Georgian date

# Convert to Hindu Panchang date
hindu_date = georgian_date.to_hindu()

# Extract individual components of the Hindu Panchang date
hindu_year = hindu_date.year
hindu_month = hindu_date.month
hindu_day = hindu_date.day

# Print the converted date components
print(f"Hindu Panchang Date: {hindu_year}-{hindu_month:02d}-{hindu_day:02d}")
