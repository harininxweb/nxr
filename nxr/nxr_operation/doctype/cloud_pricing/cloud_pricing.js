// Copyright (c) 2026, Nxweb and contributors
// For license information, please see license.txt


frappe.ui.form.on("Cloud Pricing", {
    refresh(frm) {
        set_instance_options(frm);
    },

    provider(frm) {
        frm.set_value("instance_type", "");
        set_instance_options(frm);
    },
    monthly_price(frm) {
        calculate_costs(frm);
    },
    vcpu(frm) {
        calculate_costs(frm);
    },
    memory_gb(frm) {
        calculate_costs(frm);
    },
    disk_gb(frm) {
        calculate_costs(frm);
    }
});

const INSTANCE_OPTIONS = {
    "Hetzner CCX": [
        "ccx13",
        "ccx23",
        "ccx33",
        "ccx43",
        "ccx53",
        "ccx63"
    ],
    "AWS Graviton": [
        "c8g.large",
        "m8g.large",
        "r8g.large",
        "c8g.xlarge",
        "m8g.xlarge",
        "r8g.xlarge",
        "c8g.2xlarge",
        "m8g.2xlarge",
        "r8g.2xlarge",
        "c8g.4xlarge",
        "m8g.4xlarge",
        "r8g.4xlarge"
    ],
    "Digital Ocean": [
        "g-2vcpu-8gb",
        "g-4vcpu-16gb",
        "g-8vcpu-32gb",
        "g-16vcpu-64gb"
    ],
    "Oracle Cloud": [
        "2x4",
        "2x8",
        "2x16",
        "4x8",
        "4x16",
        "4x32",
        "8x16",
        "8x32",
        "8x64",
        "16x32",
        "16x64",
        "16x128"
    ]
};

function set_instance_options(frm) {
    const options = INSTANCE_OPTIONS[frm.doc.provider] || [];
    frm.set_df_property(
        "instance_type",
        "options",
        options.join("\n")
    );
    frm.refresh_field("instance_type");
}

function calculate_costs(frm) {
    const monthly_price = flt(frm.doc.monthly_price);
    const vcpus = flt(frm.doc.vcpu);
    const memory_gb = flt(frm.doc.memory_gb);
    const disk_gb = flt(frm.doc.disk_gb);
    frm.set_value(
        "cost_per_vcpu",
        vcpus ? flt(monthly_price / vcpus, 2) : 0
    );
    frm.set_value(
        "cost_per_gb_ram",
        memory_gb ? flt(monthly_price / memory_gb, 2) : 0
    );
    frm.set_value(
        "cost_per_gb_disk",
        disk_gb ? flt(monthly_price / disk_gb, 2) : 0
    );
    frm.set_value(
        "daily_price",
        monthly_price ? flt(monthly_price / 30, 2) : 0
    );
    frm.set_value(
        "margin__20",
        monthly_price ? flt(monthly_price * 1.20, 2) : 0
    );
    frm.set_value(
        "margin__30",
        monthly_price ? flt(monthly_price * 1.30, 2) : 0
    );
}







// frappe.ui.form.on("Cloud Pricing", {
// 	refresh(frm) {
//         set_instance_options(frm);
//     },

//     provider(frm) {
//         set_instance_options(frm);

//         // Optional: Clear existing values if provider changes
//         (frm.doc.cloud_pricing_detail || []).forEach(row => {
//             row.instance_type = "";
//         });

//         frm.refresh_field("cloud_pricing_detail");
//     }
// });


// const INSTANCE_OPTIONS = {
//     "Hetzner CCX": [
//         "ccx13",
//         "ccx23",
//         "ccx33",
//         "ccx43",
//         "ccx53",
//         "ccx63"
//     ],
//     "AWS Graviton": [
//         "c8g.large",
//         "m8g.large",
//         "r8g.large",
//         "c8g.xlarge",
//         "m8g.xlarge",
//         "r8g.xlarge",
//         "c8g.2xlarge",
//         "m8g.2xlarge",
//         "r8g.2xlarge",
//         "c8g.4xlarge",
//         "m8g.4xlarge",
//         "r8g.4xlarge"
//     ],
//     "Digital Ocean": [
//         "g-2vcpu-8gb",
//         "g-4vcpu-16gb",
//         "g-8vcpu-32gb",
//         "g-16vcpu-64gb"
//     ],
//     "Oracle Cloud": [
//         "2x4",
//         "2x8",
//         "2x16",
//         "4x8",
//         "4x16",
//         "4x32",
//         "8x16",
//         "8x32",
//         "8x64",
//         "16x32",
//         "16x64",
//         "16x128"
//     ]
// };

// function set_instance_options(frm) {
//     const options = INSTANCE_OPTIONS[frm.doc.provider] || [];

//     frm.fields_dict.cloud_pricing_detail.grid.update_docfield_property(
//         "instance_type",
//         "options",
//         options.join("\n")
//     );

//     frm.refresh_field("cloud_pricing_detail");
// }


// frappe.ui.form.on("Cloud Pricing Detail", {
//     monthly_price(frm, cdt, cdn) {
//         calculate_costs(frm, cdt, cdn);
//     },

//     vcpu(frm, cdt, cdn) {
//         calculate_costs(frm, cdt, cdn);
//     },

//     memory_gb(frm, cdt, cdn) {
//         calculate_costs(frm, cdt, cdn);
//     },

//     disk_gb(frm, cdt, cdn) {
//         calculate_costs(frm, cdt, cdn);
//     }
// });


// function calculate_costs(frm, cdt, cdn) {
//     let row = locals[cdt][cdn];

//     const monthly_price = flt(row.monthly_price);
//     const vcpu = flt(row.vcpu);
//     const memory_gb = flt(row.memory_gb);
//     const disk_gb = flt(row.disk_gb);

//     // Cost calculations
//     row.cost_per_vcpu = vcpu ? flt(monthly_price / vcpu, 2) : 0;
//     row.cost_per_gb_ram = memory_gb ? flt(monthly_price / memory_gb, 2) : 0;
//     row.cost_per_gb_disk = disk_gb ? flt(monthly_price / disk_gb, 2) : 0;

//     // Margin calculations
//     row.margin__20 = monthly_price ? flt(monthly_price * 1.20, 2) : 0;
//     row.margin__30 = monthly_price ? flt(monthly_price * 1.30, 2) : 0;

//     refresh_field("cloud_pricing_detail");
// }

