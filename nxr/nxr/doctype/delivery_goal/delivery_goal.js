// Copyright (c) 2026, Nxweb and contributors
// For license information, please see license.txt

frappe.ui.form.on("Delivery Goal", {
	refresh(frm) {
		get_average_bill_rate(frm);
	},

	fetch_month(frm) {

		if (!frm.doc.yearly_target_amount) {
			frappe.msgprint("Please enter Yearly Target Amount");
			return;
		}

		if (!frm.doc.date) {
			frappe.msgprint("Please select Date");
			return;
		}

		frappe.call({
			method: "nxr.nxr.doctype.delivery_goal.delivery_goal.generate_monthly_targets",
			args: {
				yearly_target_amount: frm.doc.yearly_target_amount,
				average_bill_rate: frm.doc.average_bill_rate,
				date: frm.doc.date
			},
			callback(r) {

				if (!r.message) return;

				frm.clear_table("monthly_target_resource");

				r.message.forEach(row => {

					let child = frm.add_child("monthly_target_resource");

					child.month = row.month;
					child.monthly_revenue_goal = row.monthly_revenue_goal;
					child.required_billable_hours = row.required_billable_hours;
					child.working_hours = row.working_hours;
				});

				frm.refresh_field("monthly_target_resource");
			}
		});
	}
});


function get_average_bill_rate(frm) {

	frappe.call({
		method: "nxr.nxr.doctype.delivery_goal.delivery_goal.get_average_bill_rate",
		callback(r) {
			if (r.message) {
				frm.set_value("average_bill_rate", r.message);
			}
		}
	});

}


frappe.ui.form.on("Monthly Target Resource", {

	utilization_percentage(frm, cdt, cdn) {

		calculate_resource_values(cdt, cdn);
	}

});


function calculate_resource_values(cdt, cdn) {

	let row = locals[cdt][cdn];

	if (
		!row.required_billable_hours ||
		!row.utilization_percentage
	) {
		frappe.model.set_value(
			cdt,
			cdn,
			"required_available_hours",
			0
		);

		frappe.model.set_value(
			cdt,
			cdn,
			"required_resources",
			0
		);

		return;
	}

	let required_available_hours =
		row.required_billable_hours /
		(row.utilization_percentage / 100);

	let required_resources =
		required_available_hours /
		row.working_hours;

	frappe.model.set_value(
		cdt,
		cdn,
		"required_available_hours",
		required_available_hours.toFixed(2)
	);

	frappe.model.set_value(
		cdt,
		cdn,
		"required_resources",
		required_resources.toFixed(2)
	);
}
