# Copyright (c) 2026, Nxweb and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt


class DeliveryTarget(Document):

    def validate(self):
        self.calculate_available_hours()

    def calculate_available_hours(self):
        # Number of rows in child table
        employee_count = len(self.resource_capacity_detail or [])

        # Calculate Available Hours
        self.available_hours = flt(self.working_hours_per_month) * employee_count