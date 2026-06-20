# Copyright (c) 2026, Nxweb and contributors
# For license information, please see license.txt

import frappe
import calendar

from frappe.model.document import Document
from frappe.utils import getdate, flt


class RevenueGoal(Document):
	pass


@frappe.whitelist()
def get_average_bill_rate():

	rates = frappe.get_all(
		"Billing Rate Master",
		fields=["billing_rate"],
		filters={"billing_rate": [">", 0]}
	)

	if not rates:
		return 0

	total = sum(flt(d.billing_rate) for d in rates)
	average = total / len(rates)

	return round(average, 2)


@frappe.whitelist()
def generate_monthly_targets(
	yearly_target_amount,
	average_bill_rate,
	date
):

	yearly_target_amount = flt(yearly_target_amount)
	average_bill_rate = flt(average_bill_rate)

	if not date:
		frappe.throw("Please select Date")

	year = getdate(date).year

	monthly_revenue_goal = yearly_target_amount / 12

	holiday_list = frappe.get_all(
		"Holiday List",
		filters={
			"from_date": ["<=", f"{year}-01-01"],
			"to_date": [">=", f"{year}-12-31"]
		},
		fields=["name"],
		limit=1
	)

	holiday_dates = []

	if holiday_list:
		holiday_dates = frappe.get_all(
			"Holiday",
			filters={"parent": holiday_list[0].name},
			fields=["holiday_date"]
		)

		holiday_dates = [
			getdate(d.holiday_date)
			for d in holiday_dates
		]

	months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	]

	data = []

	for month_no in range(1, 13):

		total_days = calendar.monthrange(year, month_no)[1]

		holiday_count = len([
			d for d in holiday_dates
			if d.month == month_no and d.year == year
		])

		working_days = total_days - holiday_count
		working_hours = working_days * 8

		required_billable_hours = (
			monthly_revenue_goal / average_bill_rate
			if average_bill_rate else 0
		)

		data.append({
			"month": months[month_no - 1],
			"monthly_revenue_goal": round(monthly_revenue_goal, 2),
			"required_billable_hours": round(required_billable_hours, 2),
			"working_hours": working_hours
		})

	return data