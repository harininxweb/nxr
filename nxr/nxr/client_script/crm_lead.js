frappe.ui.form.on("CRM Lead", {
    refresh: function(frm) {
        calculate_total_meddic_score(frm);
        set_qualification_level(frm);
    },
    custom_total_meddic_score(frm) {
        set_qualification_level(frm);
    },
    custom_lead_meddic_assessment_remove: function(frm) {
        calculate_total_meddic_score(frm);
    },
    custom_fetch_questions: function(frm) {
        frm.clear_table("custom_lead_meddic_assessment");

        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Goal",
                filters: {
                    method: frm.doc.custom_qualification_method,
                    active: 1
                },
                fields: [
                    "name",
                    "goal",
                    "weight",
                    "display_order",
                    "method",
                    "meddic_component",
                    "meddpicc_component",
                    "bant_component",
                    "champ_component",
                    "anum_component",
                    "spiced_component"
                ],
                order_by: "display_order asc",
                limit_page_length: 1000
            },
            callback(r) {
                if (r.message && r.message.length) {

                    const component_field = {
                        "MEDDIC": "meddic_component",
                        "MEDDPICC": "meddpicc_component",
                        "BANT": "bant_component",
                        "CHAMP": "champ_component",
                        "ANUM": "anum_component",
                        "SPICED": "spiced_component"
                    };

                    r.message.forEach(function(d) {

                        let row = frm.add_child("custom_lead_meddic_assessment");

                        row.meddic_component = d[component_field[frm.doc.custom_qualification_method]] || "";
                        row.question = d.name;
                        row.weight = d.weight || 0;

                    });

                    frm.refresh_field("custom_lead_meddic_assessment");

                    frappe.show_alert({
                        message: __("Questions Loaded"),
                        indicator: "green"
                    });

                } else {
                    frappe.msgprint(__("No Goals found."));
                }
            }
        });

    }
});

function calculate_total_meddic_score(frm) {

    let total = 0;

    (frm.doc.custom_lead_meddic_assessment || []).forEach(row => {
        total += flt(row.score);
    });

    frm.set_value("custom_total_meddic_score", total);

    // Refresh qualification after total changes
    set_qualification_level(frm);
}

function set_qualification_level(frm) {

    frappe.db.get_single_value("NxR Settings", "red_flag_count")
        .then(function(red_flag_limit) {

            red_flag_limit = cint(red_flag_limit) || 5;

            let score = flt(frm.doc.custom_total_meddic_score || 0);

            // Count Red Flags
            let red_flags = (frm.doc.custom_lead_meddic_assessment || [])
                .filter(row => cint(row.red_flag) === 1).length;

            // If red flags reach the configured limit
            if (red_flags >= red_flag_limit) {
                frm.set_value(
                    "custom_qualification_level",
                    "Unqualified Lead"
                );
                return;
            }

            let level = "Unqualified Lead";

            if (score >= 80) {
                level = "Highly Qualified Lead";
            } else if (score >= 60) {
                level = "Qualified Lead";
            } else if (score >= 40) {
                level = "Nurture Lead";
            }

            frm.set_value("custom_qualification_level", level);
        });
}

frappe.ui.form.on("Lead Qualification Assessment", {
    score: function(frm, cdt, cdn) {

        let row = locals[cdt][cdn];

        if (flt(row.score) > flt(row.weight)) {
            frappe.msgprint(
                __("Score cannot be greater than Weight ({0})", [row.weight])
            );

            frappe.model.set_value(cdt, cdn, "score", row.weight);
            return;
        }

        // Set/Clear Red Flag
        frappe.model.set_value(
            cdt,
            cdn,
            "red_flag",
            flt(row.score) <= 0 ? 1 : 0
        );

        calculate_total_meddic_score(frm);
        set_qualification_level(frm);
    },
    custom_lead_meddic_assessment_remove: function(frm) {
        calculate_total_meddic_score(frm);
    }
});