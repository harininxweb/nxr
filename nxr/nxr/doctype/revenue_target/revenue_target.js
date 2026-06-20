// Copyright (c) 2026, Nxweb and contributors
// For license information, please see license.txt

frappe.ui.form.on("Revenue Target", {
    refresh(frm) {
        frm.fields_dict.fetch_employee.$input.off("click").on("click", function() {

            if (!frm.doc.working_hours_per_month) {
                frappe.msgprint("Please calculate Working Hours Per Month first.");
                return;
            }

            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Employee",
                    fields: [
                        "name",
                        "employee_name",
                        "designation"
                    ],
                    filters: {
                        status: "Active"
                    },
                    limit_page_length: 1000
                },
                callback: function(r) {

                    if (!r.message) return;

                    frm.clear_table("resource_capacity_detail");

                    r.message.forEach(emp => {

                        let row = frm.add_child("resource_capacity_detail");

                        row.employee_id = emp.name;
                        row.employee_name = emp.employee_name;
                        row.designation = emp.designation;
                        row.available_hours = frm.doc.working_hours_per_month;
                    });

                    frm.refresh_field("resource_capacity_detail");
                    calculate_total_billable_hours(frm);

                    frappe.msgprint(
                        `${r.message.length} active employees fetched successfully.`
                    );
                }
            });
        });
    },

    from_date: function(frm) {
        calculate_working_days(frm);
    },

    to_date: function(frm) {
        calculate_working_days(frm);
    },

    working_hours_per_day: function(frm) {
        calculate_working_days(frm);
    },

    update_total_billable_hours(frm) {
        calculate_total_billable_hours(frm);
    },
    total_billable_hours(frm) {
        calculate_revenue_capacity(frm);
    },
    average_billing_rate(frm) {
        update_revenue_capacity(frm);
    },
    realization_percentage(frm) {
        update_realistic_revenue_target(frm);
    },

    revenue_capacity(frm) {
        update_realistic_revenue_target(frm);
    }
});


function calculate_working_days(frm) {
    if (!frm.doc.from_date || !frm.doc.to_date) {
        return;
    }

    // Total days including both from_date and to_date
    let total_days = frappe.datetime.get_day_diff(
        frm.doc.to_date,
        frm.doc.from_date
    ) + 1;

    // Fetch holiday dates from Holiday List child table
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Holiday",
            fields: ["holiday_date"],
            filters: {
                holiday_date: [
                    "between",
                    [frm.doc.from_date, frm.doc.to_date]
                ]
            },
            limit_page_length: 1000
        },
        callback: function(r) {
            if (r.message) {
                let holiday_count = r.message.length;

                let working_days = total_days - holiday_count;

                frm.set_value("working_days", working_days);

                let hours_per_day = frm.doc.working_hours_per_day || 0;

                frm.set_value(
                    "working_hours_per_month",
                    working_days * hours_per_day
                );
            }
        }
    });
}


frappe.ui.form.on("Resource Capacity Detail", {

    utilization_percentage(frm, cdt, cdn) {
        calculate_billable_hours(frm, cdt, cdn);
    },

    available_hours(frm, cdt, cdn) {
        calculate_billable_hours(frm, cdt, cdn);
    },

    billable_hours(frm, cdt, cdn) {
        calculate_total_billable_hours(frm);
    },

    resource_capacity_detail_remove(frm) {
        calculate_total_billable_hours(frm);
    }
});


function calculate_billable_hours(frm, cdt, cdn) {

    let row = locals[cdt][cdn];

    let available_hours = flt(row.available_hours);
    let utilization = flt(row.utilization_percentage);

    let billable_hours =
        (available_hours * utilization) / 100;

    frappe.model.set_value(
        cdt,
        cdn,
        "billable_hours",
        billable_hours
    );

    calculate_total_billable_hours(frm);
}


function calculate_total_billable_hours(frm) {

    let total = 0;

    (frm.doc.resource_capacity_detail || []).forEach(row => {
        total += flt(row.billable_hours);
    });

    frm.set_value("total_billable_hours", total);

    calculate_revenue_capacity(frm);
}

function calculate_revenue_capacity(frm) {

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Billing Rate Master",
            fields: ["billing_rate"],
            limit_page_length: 1000
        },
        callback: function(r) {

            if (!r.message || !r.message.length) {
                frm.set_value("average_billing_rate", 0);
                frm.set_value("revenue_capacity", 0);
                return;
            }

            let total_billing_rate = 0;

            r.message.forEach(row => {
                total_billing_rate += flt(row.billing_rate);
            });

            let average_billing_rate =
                total_billing_rate / r.message.length;

            frm.set_value(
                "average_billing_rate",
                average_billing_rate
            );

            update_revenue_capacity(frm);
        }
    });
}

function update_revenue_capacity(frm) {

    frm.set_value(
        "revenue_capacity",
        flt(frm.doc.average_billing_rate) *
        flt(frm.doc.total_billable_hours)
    );

    update_realistic_revenue_target(frm);
}

function update_realistic_revenue_target(frm) {

    let revenue_capacity = flt(frm.doc.revenue_capacity);
    let realization_percentage = flt(frm.doc.realization_percentage);

    frm.set_value(
        "realistic_revenue_target",
        (revenue_capacity * realization_percentage) / 100
    );
}